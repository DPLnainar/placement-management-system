import { Response } from 'express';
import { User } from '../models/index';
import type { IAuthRequest } from '../types/index';

/**
 * Get All Users in Admin's College
 * 
 * ADMIN/MODERATOR ENDPOINT
 * 
 * Returns users based on role:
 * - Admins see ALL users in their college
 * - Moderators see ONLY students in their department
 */
export const getCollegeUsers = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { role, status } = req.query;

        // Build query filter
        const filter: any = {
            collegeId: req.user?.collegeId?._id || req.user?.collegeId
        };

        // Optional filters
        if (role && ['admin', 'moderator', 'student'].includes(role as string)) {
            filter.role = role;
        }

        if (status && ['active', 'inactive', 'pending'].includes(status as string)) {
            filter.status = status;
        }

        // Moderators can only see students in their department
        if (req.user?.role === 'moderator') {
            filter.role = 'student';  // Force to only students
            filter.department = req.user.department;  // Only their department
        }

        // Fetch users
        const users = await User.find(filter)
            .select('-password')
            .populate('assignedBy', 'username fullName role')
            .sort({ createdAt: -1 });

        // Import StudentData model
        const StudentData = require('../models/StudentData').default;

        // For students, fetch their profile completion status
        const usersWithProfileStatus = await Promise.all(users.map(async (user) => {
            let profileCompleted = false;
            let mandatoryFieldsCompleted = false;

            // If user is a student, check their profile completion
            if (user.role === 'student') {
                try {
                    const studentData = await StudentData.findOne({ userId: user._id });
                    if (studentData) {
                        profileCompleted = studentData.isProfileCompleted || false;
                        mandatoryFieldsCompleted = studentData.mandatoryFieldsCompleted || false;

                        // Perform a "live" check if currently false (stale data fix)
                        if (!profileCompleted) {
                            const hasPersonalInfo = !!(
                                (studentData.personal?.name || user.fullName) &&
                                (studentData.personal?.email || user.email) &&
                                (studentData.personal?.phone || (studentData as any).phoneNumber) &&
                                (studentData.personal?.dob || (studentData as any).dateOfBirth) &&
                                (studentData.personal?.gender || (studentData as any).gender)
                            );
                            const hasAcademicInfo = !!(
                                (studentData.education?.tenth?.percentage || (studentData as any).tenthPercentage) &&
                                (studentData.education?.twelfth?.percentage || (studentData as any).twelfthPercentage) &&
                                (studentData.education?.graduation?.cgpa || (studentData as any).cgpa)
                            );

                            mandatoryFieldsCompleted = hasPersonalInfo && hasAcademicInfo;

                            // A profile is complete if mandatory fields are done AND they have some skills OR experience
                            const hasSkills = (studentData.skills?.length > 0) ||
                                (studentData.technicalSkills?.programming?.length > 0) ||
                                (studentData.technicalSkills?.tools?.length > 0) ||
                                (studentData.softSkills?.length > 0);

                            const hasExperience = (studentData.internships?.length > 0) ||
                                (studentData.projects?.length > 0) ||
                                (studentData.workExperience?.length > 0);

                            profileCompleted = mandatoryFieldsCompleted && (hasSkills || hasExperience);

                            // Proactively update the StudentData record
                            if (mandatoryFieldsCompleted !== studentData.mandatoryFieldsCompleted ||
                                profileCompleted !== studentData.isProfileCompleted) {
                                StudentData.updateOne(
                                    { _id: studentData._id },
                                    {
                                        mandatoryFieldsCompleted,
                                        isProfileCompleted: profileCompleted
                                    }
                                ).catch(e => console.error('Background profile sync error:', e));
                            }
                        }

                        // NEW: Also sync User approval status if Student is verified
                        if (studentData.verificationStatus === 'VERIFIED' && user.isApproved === false) {
                            User.updateOne(
                                { _id: user._id },
                                { isApproved: true, status: 'active' }
                            ).catch(e => console.error('Background user approval sync error:', e));
                            // Update local copy for immediate response
                            (user as any).isApproved = true;
                            (user as any).status = 'active';
                            console.log(`✅ Live synced approval for verified student: ${user.email}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching student data for user ${user._id}:`, error);
                }
            }

            return {
                _id: user._id,
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                status: user.status,
                isActive: user.status === 'active',
                isApproved: (user as any).isApproved || false,
                department: (user as any).department || '',
                assignedBy: (user as any).assignedBy,
                createdAt: user.createdAt,
                profileCompleted,  // Add profile completion status
                mandatoryFieldsCompleted  // Add mandatory fields status
            };
        }));

        res.json({
            success: true,
            count: usersWithProfileStatus.length,
            users: usersWithProfileStatus
        });

    } catch (error: any) {
        console.error('Get college users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
};

/**
 * Update User Status
 * 
 * ADMIN ENDPOINT
 * 
 * Updates a user's status (active/inactive)
 */
export const updateUserStatus = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!status || !['active', 'inactive', 'pending'].includes(status)) {
            res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active, inactive, or pending'
            });
            return;
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Verify user belongs to same college (admin can only manage their college)
        if (req.user?.role === 'admin' && user.collegeId?.toString() !== req.user.collegeId?.toString()) {
            res.status(403).json({
                success: false,
                message: 'Unauthorized: User not in your college'
            });
            return;
        }

        // NEW: Admin-Only Deactivation Rule
        if (status === 'inactive' && req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            res.status(403).json({
                success: false,
                message: 'Unauthorized: Only administrators can deactivate accounts'
            });
            return;
        }

        // Update status
        user.status = status;
        await user.save();

        res.json({
            success: true,
            message: 'User status updated successfully',
            data: {
                _id: user._id,
                username: user.username,
                status: user.status
            }
        });

    } catch (error: any) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating user status'
        });
    }
};

/**
 * Create User (Admin/Moderator only)
 * 
 * Allows Admins/Moderators to create users (mainly Students) 
 * without logging them in (no cookies/tokens set).
 */
export const createUser = async (req: IAuthRequest, res: Response): Promise<void> => {
    try {
        const { username, email, password, fullName, role, department, collegeId } = req.body;

        // 1. Validation
        if (!username || !email || !password || !fullName || !role) {
            res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
            return;
        }

        // Only allow creating 'student' or 'moderator' (though moderators should use the dedicated endpoint)
        if (!['student', 'moderator'].includes(role)) {
            res.status(400).json({
                success: false,
                message: 'Invalid role. Only students and moderators can be created.'
            });
            return;
        }

        // 2. Permission Check
        // Admins can create Students and Moderators
        // Moderators can ONLY create Students in their own department
        if (req.user?.role === 'moderator') {
            if (role !== 'student') {
                res.status(403).json({ success: false, message: 'Moderators can only create students' });
                return;
            }
            // Enforce department
            if (department && department !== req.user.department) {
                res.status(403).json({ success: false, message: 'Moderators can only create students in their own department' });
                return;
            }
        }

        // 3. Check Existence
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
            return;
        }

        // 4. Create User
        // Use requester's collegeId if not provided (for moderators/admins creating users in their college)
        const targetCollegeId = collegeId || req.user?.collegeId;

        const user = await User.create({
            username,
            email,
            password,
            fullName,
            role,
            collegeId: targetCollegeId,
            department,
            isActive: true,
            status: 'active',
            assignedBy: req.user?._id
        });

        // 5. Response (NO TOKEN)
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    department: user.department
                }
            }
        });

    } catch (error: any) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating user',
            error: error.message
        });
    }
};