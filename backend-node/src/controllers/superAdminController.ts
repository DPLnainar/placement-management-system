import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { College, User, Job } from '../models/index';
import sendEmail from '../utils/sendEmail';
import { bulkUploadSummaryEmail } from '../utils/emailTemplates';
import type { IAuthRequest } from '../types/index';

/**
 * CREATE COLLEGE WITH ADMIN
 */
export const createCollegeWithAdmin = async (req: IAuthRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // SECURITY CHECK: Only Super Admin can create colleges
        if (req.user?.role !== 'superadmin') {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
            return;
        }

        const {
            collegeName,
            collegeAddress,
            collegeCode,
            subscriptionStatus = 'active',
            adminName,
            adminEmail,
            adminUsername,
            adminPassword
        } = req.body;

        // Validate required fields
        if (!collegeName || !collegeAddress || !collegeCode || !adminName || !adminEmail || !adminUsername || !adminPassword) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({
                success: false,
                message: 'Missing required fields. Need: collegeName, collegeAddress, collegeCode, adminName, adminEmail, adminUsername, adminPassword'
            });
            return;
        }

        // Check if college with same name or code already exists
        const existingCollege = await College.findOne({
            $or: [
                { name: collegeName.trim() },
                { code: collegeCode.toUpperCase().trim() }
            ]
        });

        if (existingCollege) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({
                success: false,
                message: 'A college with this name or code already exists'
            });
            return;
        }

        // Check if admin username or email already exists
        const existingUser = await User.findOne({
            $or: [
                { username: adminUsername.toLowerCase().trim() },
                { email: adminEmail.toLowerCase().trim() }
            ]
        });

        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({
                success: false,
                message: 'A user with this username or email already exists'
            });
            return;
        }

        // TRANSACTION STEP 1: Create the College
        const college = new College({
            name: collegeName.trim(),
            location: collegeAddress.trim(),
            code: collegeCode.toUpperCase().trim(),
            subscriptionStatus: subscriptionStatus,
            status: 'active'
        });

        await college.save({ session });

        // TRANSACTION STEP 2: Create the College Admin
        const admin = new User({
            username: adminUsername.toLowerCase().trim(),
            email: adminEmail.toLowerCase().trim(),
            password: adminPassword,  // Will be hashed by pre-save hook
            fullName: adminName.trim(),
            role: 'admin',  // College Admin role
            collegeId: college._id,  // Link to the new college
            assignedBy: req.user._id,  // Assigned by Super Admin
            status: 'active'
        });

        await admin.save({ session });

        // TRANSACTION STEP 3: Link Admin to College
        // Note: College model might use adminId or adminUserId, checking schema...
        // Based on legacy code it used adminId.
        (college as any).adminId = admin._id;
        await college.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // Return success response with credentials
        const adminResponse = admin.toObject();
        delete adminResponse.password;  // Remove password from response

        res.status(201).json({
            success: true,
            message: 'College and Admin created successfully',
            data: {
                college: {
                    id: college._id,
                    name: college.name,
                    code: college.code,
                    location: (college as any).location,
                    subscriptionStatus: (college as any).subscriptionStatus,
                    adminId: (college as any).adminId
                },
                admin: adminResponse,
                credentials: {
                    username: admin.username,
                    password: adminPassword,  // Return plain password once (for Super Admin to share)
                    message: 'Share these credentials securely with the College Admin'
                }
            }
        });

    } catch (error: any) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();

        console.error('Create college with admin error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Error creating college and admin. Transaction rolled back.'
        });
    }
};

/**
 * GET ALL PLACEMENT DATA
 */
export const getAllPlacementData = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { dataType = 'jobs' } = req.query;
        let query: any = {};
        let Model: any;

        // Determine which model to query
        switch (dataType) {
            case 'jobs':
                Model = Job;
                break;
            case 'students':
            case 'users':
                Model = User;
                if (dataType === 'students') {
                    query.role = 'student';
                }
                break;
            case 'colleges':
                Model = College;
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: 'Invalid dataType. Use: jobs, students, users, or colleges'
                });
                return;
        }

        // SUPER_ADMIN - Fetch ALL data
        if (req.user?.role === 'superadmin') {
            const data = await Model.find(query)
                .populate('collegeId', 'name code location')
                .sort({ createdAt: -1 })
                .limit(100);

            res.status(200).json({
                success: true,
                role: 'SUPER_ADMIN',
                scope: 'GLOBAL',
                count: data.length,
                data: data
            });
            return;
        }

        // COLLEGE_ADMIN - Fetch ONLY their college's data
        if (req.user?.role === 'admin') {
            if (!req.user.collegeId) {
                res.status(403).json({
                    success: false,
                    message: 'College Admin not properly configured - no college assigned'
                });
                return;
            }

            if (dataType !== 'colleges') {
                query.collegeId = (req.user.collegeId as any)._id || req.user.collegeId;
            }

            const data = await Model.find(query)
                .populate('collegeId', 'name code location')
                .sort({ createdAt: -1 })
                .limit(100);

            res.status(200).json({
                success: true,
                role: 'COLLEGE_ADMIN',
                scope: 'LOCAL',
                college: (req.user.collegeId as any).name,
                count: data.length,
                data: data
            });
            return;
        }

        res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.'
        });

    } catch (error: any) {
        console.error('Get placement data error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching placement data'
        });
    }
};

/**
 * GET ALL COLLEGES
 */
export const getAllColleges = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'superadmin') {
            res.status(403).json({
                success: false,
                message: 'Forbidden. Only Super Admin can view all colleges.'
            });
            return;
        }

        const colleges = await College.find()
            .populate('adminId', 'username email fullName status') // Assuming adminId exists in College schema
            .sort({ createdAt: -1 });

        const collegesWithStats = await Promise.all(
            colleges.map(async (college) => {
                const studentCount = await User.countDocuments({
                    collegeId: college._id,
                    role: 'student'
                });

                const jobCount = await Job.countDocuments({
                    collegeId: college._id
                });

                return {
                    id: college._id,
                    name: college.name,
                    code: college.code,
                    location: (college as any).location,
                    subscriptionStatus: (college as any).subscriptionStatus,
                    status: college.status,
                    admin: (college as any).adminId,
                    stats: {
                        students: studentCount,
                        jobs: jobCount
                    },
                    createdAt: college.createdAt
                };
            })
        );

        res.status(200).json({
            success: true,
            count: collegesWithStats.length,
            data: collegesWithStats
        });

    } catch (error: any) {
        console.error('Get all colleges error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching colleges'
        });
    }
};

/**
 * GET DASHBOARD STATISTICS
 */
export const getDashboardStats = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        let stats = {};

        // SUPER ADMIN - Global statistics
        if (req.user?.role === 'superadmin') {
            const totalColleges = await College.countDocuments({ status: 'active' });
            const totalStudents = await User.countDocuments({ role: 'student', status: 'active' });
            const totalAdmins = await User.countDocuments({ role: 'admin', status: 'active' });

            stats = {
                role: 'SUPER_ADMIN',
                scope: 'GLOBAL',
                totalColleges,
                totalStudents,
                totalAdmins
            };
        }
        // COLLEGE ADMIN - College-specific statistics
        else if (req.user?.role === 'admin') {
            const collegeId = (req.user.collegeId as any)._id || req.user.collegeId;

            const totalStudents = await User.countDocuments({
                collegeId: collegeId,
                role: 'student',
                status: 'active'
            });

            const totalModerators = await User.countDocuments({
                collegeId: collegeId,
                role: 'moderator',
                status: 'active'
            });

            const totalJobs = await Job.countDocuments({
                collegeId: collegeId,
                status: 'active'
            });

            stats = {
                role: 'COLLEGE_ADMIN',
                scope: 'LOCAL',
                college: (req.user.collegeId as any).name,
                totalStudents,
                totalModerators,
                totalJobs
            };
        } else {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error: any) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics'
        });
    }
};

/**
 * SEND BULK UPLOAD SUMMARY EMAIL
 */
export const sendBulkUploadEmail = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'superadmin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
            return;
        }

        const { results } = req.body;

        if (!results || !results.successful || !results.failed || results.total === undefined) {
            res.status(400).json({
                success: false,
                message: 'Invalid results data provided'
            });
            return;
        }

        const superAdmin = await User.findById(req.user._id);
        if (!superAdmin) {
            res.status(404).json({
                success: false,
                message: 'Super admin user not found'
            });
            return;
        }

        const emailHTML = bulkUploadSummaryEmail(
            results,
            (superAdmin as any).fullName || superAdmin.username,
            superAdmin.email
        );

        await sendEmail({
            to: superAdmin.email,
            subject: `Bulk Upload Summary: ${results.successful.length}/${results.total} Colleges Created Successfully`,
            text: `Bulk upload completed. Successful: ${results.successful.length}, Failed: ${results.failed.length}. Please check the HTML email for details.`,
            html: emailHTML
        });

        res.status(200).json({
            success: true,
            message: 'Bulk upload summary email sent successfully'
        });

    } catch (error: any) {
        console.error('Send bulk upload email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending bulk upload summary email',
            error: error.message
        });
    }
};

/**
 * UPDATE COLLEGE
 */
export const updateCollege = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'superadmin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
            return;
        }

        const { id } = req.params;
        const { collegeName, collegeAddress, collegeCode, subscriptionStatus } = req.body;

        const updateData: any = {};
        if (collegeName) updateData.name = collegeName.trim();
        if (collegeAddress) updateData.location = collegeAddress.trim();
        if (collegeCode) updateData.code = collegeCode.toUpperCase().trim();
        if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;

        const college = await College.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!college) {
            res.status(404).json({
                success: false,
                message: 'College not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'College updated successfully',
            data: college
        });

    } catch (error: any) {
        console.error('Update college error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating college',
            error: error.message
        });
    }
};

/**
 * DELETE COLLEGE
 */
export const deleteCollege = async (req: IAuthRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (req.user?.role !== 'superadmin') {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
            return;
        }

        const { id } = req.params;

        const college = await College.findById(id);

        if (!college) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({
                success: false,
                message: 'College not found'
            });
            return;
        }

        await User.deleteMany({ collegeId: id }).session(session);
        await Job.deleteMany({ collegeId: id }).session(session);
        await College.findByIdAndDelete(id).session(session);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'College and all associated data deleted successfully'
        });

    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        console.error('Delete college error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting college',
            error: error.message
        });
    }
};
