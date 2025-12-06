import { Request, Response } from 'express';
import StudentData from '../models/StudentData';
import Job from '../models/Job';
import Application from '../models/Application';
import { generateResumePDF } from '../services/resumeService';
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';
import ProfileDeletionRequest from '../models/ProfileDeletionRequest';
import sendEmail from '../utils/sendEmail';
import { maskAadhaar, isValidAadhaar } from '../utils/aadhaarMask';


// Get Profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        let student = await StudentData.findOne({ userId: (req as any).user._id });

        // Auto-create profile if it doesn't exist
        if (!student) {
            const user = (req as any).user;
            console.log('Creating new StudentData record for user:', user._id);

            // Extract collegeId - handle both ObjectId and populated object
            const collegeId = typeof user.collegeId === 'object' && user.collegeId._id
                ? user.collegeId._id
                : user.collegeId;

            student = await StudentData.create({
                userId: user._id,
                collegeId: collegeId,
                personal: {
                    name: user.name || '',
                    email: user.email || '',
                },
                placement: {
                    placed: false
                }
            });
            console.log('StudentData created successfully for user:', user._id);
        }

        if (!student) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Mask Aadhaar for security
        const studentData = student.toObject();
        if (studentData.personal?.aadhaar) {
            studentData.personal.aadhaar = maskAadhaar(studentData.personal.aadhaar);
        }

        res.json({ student: studentData });
    } catch (error) {
        console.error('Error in getProfile:', error);
        console.error('Error stack:', (error as Error).stack);
        res.status(500).json({
            message: 'Server error',
            error: (error as Error).message,
            details: process.env.NODE_ENV !== 'production' ? (error as Error).stack : undefined
        });
    }
};

// Update Profile
export const updateProfile = async (req: Request, res: Response) => {
    try {
        let student = await StudentData.findOne({ userId: (req as any).user._id });

        // Auto-create if doesn't exist
        if (!student) {
            const user = (req as any).user;
            console.log('Creating new StudentData record for user:', user._id);

            // Extract collegeId - handle both ObjectId and populated object
            const collegeId = typeof user.collegeId === 'object' && user.collegeId._id
                ? user.collegeId._id
                : user.collegeId;

            student = await StudentData.create({
                userId: user._id,
                collegeId: collegeId,
                personal: {
                    name: user.name || '',
                    email: user.email || '',
                },
                placement: { placed: false },
                ...req.body
            });
        } else {
            student = await StudentData.findOneAndUpdate(
                { userId: (req as any).user._id },
                req.body,
                { new: true, runValidators: true }
            );
        }

        res.json(student);
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// Upload Photo
export const uploadPhoto = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // S3 uses 'location', local storage uses 'path'
        const fileUrl = (req.file as any).location || req.file.path;

        let student = await StudentData.findOne({ userId: (req as any).user._id });

        // Auto-create if doesn't exist
        if (!student) {
            const user = (req as any).user;
            console.log('Creating new StudentData record for user:', user._id);

            // Extract collegeId - handle both ObjectId and populated object
            const collegeId = typeof user.collegeId === 'object' && user.collegeId._id
                ? user.collegeId._id
                : user.collegeId;

            student = await StudentData.create({
                userId: user._id,
                collegeId: collegeId,
                personal: {
                    name: user.name || '',
                    email: user.email || '',
                    photoUrl: fileUrl
                },
                placement: { placed: false }
            });
        } else {
            student.personal.photoUrl = fileUrl;
            await student.save();
        }

        res.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error('Error in uploadPhoto:', error);
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// Upload Resume
export const uploadResume = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        let student = await StudentData.findOne({ userId: (req as any).user._id });

        // Auto-create if doesn't exist
        if (!student) {
            const user = (req as any).user;
            console.log('Creating new StudentData record for user:', user._id);

            // Extract collegeId - handle both ObjectId and populated object
            const collegeId = typeof user.collegeId === 'object' && user.collegeId._id
                ? user.collegeId._id
                : user.collegeId;

            student = await StudentData.create({
                userId: user._id,
                collegeId: collegeId,
                personal: {
                    name: user.name || '',
                    email: user.email || '',
                },
                resume: {
                    resumeUrl: req.file.path
                },
                placement: { placed: false }
            });
        } else {
            student.resume.resumeUrl = req.file.path;
            await student.save();
        }

        res.json({ success: true, url: req.file.path });
    } catch (error) {
        console.error('Error in uploadResume:', error);
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// Generate Resume
export const generateResume = async (req: Request, res: Response) => {
    try {
        const student = await StudentData.findOne({ userId: (req as any).user._id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const pdfBuffer = await generateResumePDF(student);

        // Upload to S3
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });

        const fileName = `resumes/generated_${student.userId}_${Date.now()}.pdf`;
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ACL: 'public-read',
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        const resumeUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;

        student.resume.resumeGeneratedUrl = resumeUrl;
        student.resume.resumeGeneratedAt = new Date();
        await student.save();

        res.json({ url: resumeUrl });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get Eligible Jobs
export const getEligibleJobs = async (req: Request, res: Response) => {
    try {
        let student = await StudentData.findOne({ userId: (req as any).user._id });

        // Auto-create if doesn't exist
        if (!student) {
            const user = (req as any).user;
            console.log('Creating new StudentData record for user:', user._id);

            // Extract collegeId - handle both ObjectId and populated object
            const collegeId = typeof user.collegeId === 'object' && user.collegeId._id
                ? user.collegeId._id
                : user.collegeId;

            student = await StudentData.create({
                userId: user._id,
                collegeId: collegeId,
                personal: {
                    name: user.name || '',
                    email: user.email || '',
                },
                placement: { placed: false }
            });
        }

        // PLACEMENT LOCK: If student is placed, return empty lists
        if (student.placement.placed) {
            return res.json({
                eligibleJobs: [],
                nonEligibleJobs: [],
                placementLock: true,
                placementDetails: {
                    company: student.placement.companyName,
                    placedAt: student.placement.placedAt,
                },
                message: 'You are already placed and cannot apply to new jobs',
            });
        }

        const jobs = await Job.find({ status: 'active', isActive: true });

        const eligibleJobs = [];
        const nonEligibleJobs = [];

        for (const job of jobs) {
            const eligibility = checkEligibility(student, job);
            if (eligibility.eligible) {
                eligibleJobs.push(job);
            } else {
                nonEligibleJobs.push({ job, reasons: eligibility.reasons });
            }
        }

        res.json({ eligibleJobs, nonEligibleJobs, placementLock: false });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get Applications
export const getApplications = async (req: Request, res: Response) => {
    try {
        const applications = await Application.find({ studentId: (req as any).user._id })
            .populate('jobId', 'title company ctc location')
            .sort({ appliedAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get Placement Card
export const getPlacementCard = async (req: Request, res: Response) => {
    try {
        const student = await StudentData.findOne({ userId: (req as any).user._id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (!student.placement.placed) {
            return res.status(404).json({ message: 'Student is not placed yet' });
        }

        res.json({
            placed: true,
            companyName: student.placement.companyName,
            placedAt: student.placement.placedAt,
            jobId: student.placement.jobId,
            offerDetails: student.offerDetails,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get Notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const limit = parseInt(req.query.limit as string) || 50;

        const notifications = await getUserNotifications(userId, limit);
        const unreadCount = await getUnreadCount(userId);

        res.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Mark Notification as Read
export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user._id;

        const notification = await markAsRead(id, userId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Mark All Notifications as Read
export const markAllNotificationsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        await markAllAsRead(userId);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Request Profile Deletion
export const requestProfileDeletion = async (req: Request, res: Response) => {
    try {
        const { reason } = req.body;
        const userId = (req as any).user._id;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ message: 'Deletion reason is required' });
        }

        const student = await StudentData.findOne({ userId });
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Check if there's already a pending request
        const existingRequest = await ProfileDeletionRequest.findOne({
            userId,
            status: 'pending',
        });

        if (existingRequest) {
            return res.status(400).json({
                message: 'You already have a pending profile deletion request',
            });
        }

        // Create deletion request
        const deletionRequest = new ProfileDeletionRequest({
            studentId: student._id,
            userId,
            reason: reason.trim(),
            status: 'pending',
        });

        await deletionRequest.save();

        // Send confirmation email
        try {
            await sendEmail({
                to: (req as any).user.email,
                subject: 'Profile Deletion Request Received',
                text: 'We have received your request to delete your profile.',
                html: `
                    <h2>Profile Deletion Request</h2>
                    <p>We have received your request to delete your profile.</p>
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p>Your request will be reviewed by an administrator. You will be notified once a decision is made.</p>
                `,
            });
        } catch (emailError) {
            console.error('Failed to send deletion request email:', emailError);
        }

        res.status(201).json({
            message: 'Profile deletion request submitted successfully',
            request: deletionRequest,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

