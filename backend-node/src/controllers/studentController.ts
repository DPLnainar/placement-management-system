import { Request, Response } from 'express';
import StudentData from '../models/StudentData';
import Job from '../models/Job';
import Application from '../models/Application';
import { generateResumePDF } from '../services/resumeService';
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';
import { checkEligibility } from '../services/eligibilityService';
import ProfileDeletionRequest from '../models/ProfileDeletionRequest';
import sendEmail from '../utils/sendEmail';
import { maskAadhaar, isValidAadhaar } from '../utils/aadhaarMask';
import User from '../models/User';
import { uploadToS3, getPresignedUrl, extractS3KeyFromUrl } from '../utils/s3Upload';


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

        // Generate presigned URL for photo if it exists
        if (studentData.personal?.photoUrl) {
            try {
                const photoKey = extractS3KeyFromUrl(studentData.personal.photoUrl);
                if (photoKey) {
                    // Generate presigned URL valid for 1 hour
                    studentData.personal.photoUrl = await getPresignedUrl(photoKey, 3600);
                }
            } catch (error) {
                console.error('Error generating presigned URL for photo:', error);
                // Keep the original URL if presigned generation fails
            }
        }

        console.log('\n=== GET PROFILE - RETURNING TO FRONTEND ===');
        console.log('DOB:', studentData.personal?.dob);
        console.log('10th schoolName:', studentData.education?.tenth?.schoolName);
        console.log('12th schoolName:', studentData.education?.twelfth?.schoolName);
        console.log('10th percentage:', studentData.education?.tenth?.percentage);

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
            // Map semesterResults to semesterRecords if present (frontend/backend field name mismatch)
            const updateData = { ...req.body };
            if (updateData.semesterResults) {
                updateData.semesterRecords = updateData.semesterResults;
                delete updateData.semesterResults;
            }

            console.log('\n=== UPDATE PROFILE DEBUG ===');
            console.log('DOB received:', updateData.personal?.dob);
            console.log('10th schoolName received:', updateData.education?.tenth?.schoolName);
            console.log('12th schoolName received:', updateData.education?.twelfth?.schoolName);
            console.log('currentArrears received:', updateData.currentArrears);
            console.log('arrearHistory received:', updateData.arrearHistory);

            // LOCK & PERMISSION VALIDATION
            const userRole = (req as any).user.role;
            const userDept = (req as any).user.department;

            // 1. Moderator Permission Check: Only their department
            if (userRole === 'moderator' && student.personal?.branch && student.personal.branch !== userDept) {
                return res.status(403).json({
                    success: false,
                    message: `Unauthorized: You can only edit students in the ${userDept} department.`
                });
            }

            // 2. Lock Check: Admins and "own-department" moderators bypass locks
            const isPowerUser = userRole === 'admin' ||
                userRole === 'superadmin' ||
                (userRole === 'moderator' && student.personal?.branch === userDept);

            // Filter out lock toggles if not a power user
            if (!isPowerUser) {
                delete (updateData as any).personalInfoLocked;
                delete (updateData as any).academicInfoLocked;
                delete (updateData as any).personalInfoLockedDate;
                delete (updateData as any).academicInfoLockedDate;
            }

            if (!isPowerUser) {
                if (updateData.personal && student.personalInfoLocked) {
                    return res.status(403).json({
                        success: false,
                        message: 'Personal information is locked. Contact your department moderator to make changes.',
                        locked: true,
                        section: 'personal'
                    });
                }

                if (updateData.education && student.academicInfoLocked) {
                    return res.status(403).json({
                        success: false,
                        message: 'Academic information is locked. Contact your department moderator to make changes.',
                        locked: true,
                        section: 'academic'
                    });
                }
            }


            // Manually merge nested objects to preserve existing fields
            if (updateData.personal) {
                student.personal = { ...student.personal, ...updateData.personal };
                student.markModified('personal');
            }

            if (updateData.education) {
                // Update tenth
                if (updateData.education.tenth) {
                    student.education.tenth = {
                        ...student.education?.tenth,
                        ...updateData.education.tenth
                    };
                    student.markModified('education.tenth');
                }

                // Update twelfth
                if (updateData.education.twelfth) {
                    student.education.twelfth = {
                        ...student.education?.twelfth,
                        ...updateData.education.twelfth
                    };
                    student.markModified('education.twelfth');
                }

                // Update graduation
                if (updateData.education.graduation) {
                    student.education.graduation = {
                        ...student.education?.graduation,
                        ...updateData.education.graduation
                    };
                    student.markModified('education.graduation');
                }
            }

            // Mapping frontend 'experience' to backend 'internships'
            if (updateData.experience) {
                student.internships = updateData.experience.map((exp: any) => ({
                    company: exp.companyName || exp.company,
                    role: exp.role,
                    description: exp.description,
                    location: exp.location,
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    isOngoing: exp.isOngoing
                }));
                student.markModified('internships');
                console.log(`Mapped ${student.internships.length} experience entries to internships`);
            }

            // Standardize skills - the frontend sends 'skills' as an array of strings
            if (updateData.skills && Array.isArray(updateData.skills)) {
                student.skills = updateData.skills;
                student.markModified('skills');
            }

            // Update other top-level fields
            Object.keys(updateData).forEach(key => {
                if (key !== 'personal' && key !== 'education' && key !== 'experience' && key !== 'skills') {
                    (student as any)[key] = updateData[key];
                }
            });

            // Perform mappings and save
            // RESET VERIFICATION STATUS:
            // If a student (non-power user) updates their profile, reset status to PENDING
            if (!isPowerUser) {
                const oldStatus = student.verificationStatus;
                student.verificationStatus = 'PENDING';
                if (oldStatus === 'VERIFIED') {
                    console.log('⚠️ Profile updated by student. Verification status reset to PENDING.');
                    // Unlock sections if they were verified/locked so they can finish edits
                    student.personalInfoLocked = false;
                    student.academicInfoLocked = false;
                }
            }

            await student.save();

            console.log('After save - DOB:', student.personal?.dob);
            console.log('After save - 10th schoolName:', student.education?.tenth?.schoolName);
            console.log('After save - 12th schoolName:', student.education?.twelfth?.schoolName);
            console.log('After save - currentArrears:', student.currentArrears);

            // AUTO-CALCULATE PROFILE COMPLETION
            // Check if all mandatory fields are completed
            const mandatoryFieldsCheck = {
                hasPersonalInfo: !!(
                    student.personal?.name &&
                    student.personal?.email &&
                    student.personal?.phone &&
                    student.personal?.dob &&
                    student.personal?.gender
                ),
                hasAcademicInfo: !!(
                    student.education?.tenth?.percentage &&
                    student.education?.twelfth?.percentage &&
                    student.education?.graduation?.cgpa
                ),
                hasBasicProfile: !!(
                    student.personal?.name &&
                    student.personal?.email
                )
            };

            // Set mandatoryFieldsCompleted if all mandatory fields are present
            const allMandatoryFieldsComplete =
                mandatoryFieldsCheck.hasPersonalInfo &&
                mandatoryFieldsCheck.hasAcademicInfo;

            if (allMandatoryFieldsComplete && !student.mandatoryFieldsCompleted) {
                student.mandatoryFieldsCompleted = true;
                console.log('✅ Mandatory fields marked as completed');
            }

            // Set isProfileCompleted if profile is substantially complete
            // (includes mandatory fields plus some optional enrichment)
            const hasSkills = (student.skills?.length > 0) ||
                (student.technicalSkills?.programming?.length > 0) ||
                (student.technicalSkills?.tools?.length > 0) ||
                (student.softSkills?.length > 0);

            const hasExperience = (student.internships?.length > 0) ||
                (student.projects?.length > 0) ||
                (student.workExperience?.length > 0);

            const profileComplete = allMandatoryFieldsComplete && (hasSkills || hasExperience);

            if (profileComplete && !student.isProfileCompleted) {
                student.isProfileCompleted = true;
                console.log('✅ Profile marked as completed');
            } else if (!profileComplete && student.isProfileCompleted) {
                // Also allow it to become incomplete if data was removed
                student.isProfileCompleted = false;
                console.log('⚠️ Profile marked as incomplete (data missing)');
            }

            // If flags changed, save again
            if (allMandatoryFieldsComplete || profileComplete) {
                await student.save();
                console.log('Profile completion flags updated');
            }
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: student
        });
    } catch (error: any) {
        console.error('Error in updateProfile:', error.message);
        console.error('Stack:', error.stack);

        if (error.name === 'ValidationError') { // Mongoose validation error
            const errors = Object.values(error.errors).map((err: any) => err.message);
            console.error('Validation errors:', errors);
        } else if (error.name === 'CastError') { // Mongoose cast error
            console.error('Cast Error:', error.message);
        }

        // Send 500 but also include the error message for the frontend to see (temporarily)
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });

    }
};

// Upload Photo
export const uploadPhoto = async (req: Request, res: Response) => {
    try {
        console.log('uploadPhoto called, file:', req.file ? 'present' : 'missing');

        if (!req.file) {
            console.log('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload buffer to S3 using uploadToS3 utility
        const uploadResult = await uploadToS3(
            req.file.buffer,
            'photos',
            req.file.originalname,
            req.file.mimetype
        );

        const fileUrl = uploadResult.url;
        console.log('File uploaded to S3:', fileUrl);

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

        console.log('Photo upload successful, URL:', fileUrl);
        res.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error('Error in uploadPhoto:', error);
        console.error('Error stack:', (error as Error).stack);
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

        // Fetch active jobs
        const jobs = await Job.find({ status: 'active', isActive: true });

        // Auto-close expired jobs and filter them out
        const now = new Date();
        const validJobs = [];
        const updates = [];

        for (const job of jobs) {
            if (job.deadline && new Date(job.deadline) < now) {
                // Job is expired, mark as closed
                job.status = 'closed';
                updates.push(Job.updateOne({ _id: job._id }, { status: 'closed' }));
            } else {
                validJobs.push(job);
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        const eligibleJobs = [];
        const nonEligibleJobs = [];

        for (const job of validJobs) {
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

// Get Student Jobs with Eligibility (Universal Job Visibility)
export const getStudentJobsWithEligibility = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        // Get student data
        let student = await StudentData.findOne({ userId });

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

        // Check if student is placed
        const isPlaced = student.placement?.placed || false;

        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        // Query all active jobs from the same college
        const jobQuery = {
            collegeId: student.collegeId,
            status: 'active',
            isActive: true
        };

        const totalJobs = await Job.countDocuments(jobQuery);
        const jobs = await Job.find(jobQuery)
            .populate('postedBy', 'role name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Auto-close expired jobs
        const now = new Date();
        const updates = [];
        const validJobs = [];

        for (const job of jobs) {
            if (job.deadline && new Date(job.deadline) < now) {
                // Job is expired, mark as closed
                updates.push(Job.updateOne({ _id: job._id }, { status: 'closed' }));
            } else {
                validJobs.push(job);
            }
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        // Get all applications for this student
        const applications = await Application.find({ studentId: userId });
        const applicationMap = new Map();
        applications.forEach(app => {
            applicationMap.set(app.jobId.toString(), app.status);
        });

        // Process each job with eligibility check
        const jobsWithEligibility = [];

        for (const job of validJobs) {
            // Run eligibility check using the comprehensive service
            const eligibilityResult = checkEligibility(student, job);

            // Get application status
            const applicationStatus = applicationMap.get(job._id.toString());
            let applyStatus: 'NOT_APPLIED' | 'APPLIED' | 'PLACED' = 'NOT_APPLIED';

            if (isPlaced) {
                applyStatus = 'PLACED';
            } else if (applicationStatus) {
                applyStatus = 'APPLIED';
            }

            // Get posted by role
            const postedBy = job.postedBy as any;
            const postedByRole = postedBy?.role || 'ADMIN';

            // Build job response object
            jobsWithEligibility.push({
                jobId: job._id,
                companyName: job.companyName,
                jobRole: job.role,
                title: job.title,
                packageLPA: job.packageLPA || job.ctc,
                stipend: job.stipend,
                location: job.location,
                workLocation: job.workLocation,
                workMode: job.workMode,
                skillsRequired: job.skillsRequired || [],
                hiringRounds: job.hiringRounds || [],
                attachments: job.attachments || [],
                description: job.description,
                eligible: eligibilityResult.eligible,
                reasons: eligibilityResult.reasons,
                applyStatus,
                postedBy: {
                    role: postedByRole,
                    name: postedBy?.name
                },
                deadline: job.deadline,
                registrationDeadline: job.registrationDeadline,
                jobType: job.jobType,
                category: job.category,
                assessmentLink: job.assessmentLink,
                assessmentRequired: job.assessmentRequired,
                maxApplications: job.maxApplications,
                currentApplicationCount: job.currentApplicationCount
            });
        }

        // Sort: eligible jobs first, then not eligible
        jobsWithEligibility.sort((a, b) => {
            if (a.eligible && !b.eligible) return -1;
            if (!a.eligible && b.eligible) return 1;
            return 0;
        });

        res.json({
            success: true,
            isPlaced,
            placementDetails: isPlaced ? {
                companyName: student.placement.companyName,
                placedAt: student.placement.placedAt,
                jobId: student.placement.jobId
            } : null,
            jobs: jobsWithEligibility,
            pagination: {
                total: totalJobs,
                page,
                limit,
                totalPages: Math.ceil(totalJobs / limit)
            }
        });

    } catch (error) {
        console.error('Error in getStudentJobsWithEligibility:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: (error as Error).message
        });
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

// Get Student Offers
export const getOffers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const student = await StudentData.findOne({ userId }).populate('allOffers.jobId', 'title company ctc');

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        res.json({
            success: true,
            offers: student.allOffers || [],
            placed: student.placement.placed || false,
            placementDetails: student.placement.placed ? {
                companyName: student.placement.companyName,
                placedAt: student.placement.placedAt,
            } : null,
        });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

// Accept Offer (Student Action)
export const acceptOffer = async (req: Request, res: Response) => {
    try {
        const { offerId } = req.params;
        const userId = (req as any).user._id;

        const student = await StudentData.findOne({ userId });
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Check if already placed
        if (student.placement.placed) {
            return res.status(400).json({
                message: 'You have already accepted an offer and cannot accept another one',
                placed: true
            });
        }

        // Find the offer
        const offer = student.allOffers.find((o: any) => o._id.toString() === offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Update offer statuses
        student.allOffers.forEach((o: any) => {
            if (o._id.toString() === offerId) {
                o.status = 'accepted';
            } else if (o.status === 'pending') {
                o.status = 'rejected';
            }
        });

        // Update placement status
        student.placement.placed = true;
        student.placement.companyName = offer.companyName;
        student.placement.jobId = offer.jobId;
        student.placement.placedAt = new Date();

        await student.save();

        // Send notification email
        try {
            await sendEmail({
                to: (req as any).user.email,
                subject: 'Offer Acceptance Confirmation',
                html: `
                    <h2>Congratulations!</h2>
                    <p>You have successfully accepted the offer from <strong>${offer.companyName}</strong>.</p>
                    <p><strong>Package:</strong> ₹${offer.package} LPA</p>
                    <p>You are now marked as placed and cannot apply to other jobs.</p>
                `,
                text: `Congratulations! You have accepted the offer from ${offer.companyName} with package ₹${offer.package} LPA.`,
            });
        } catch (emailError) {
            console.error('Failed to send acceptance email:', emailError);
        }

        res.json({
            success: true,
            message: 'Offer accepted successfully',
            placement: {
                placed: true,
                companyName: offer.companyName,
                package: offer.package,
                placedAt: student.placement.placedAt,
            },
        });
    } catch (error) {
        console.error('Error accepting offer:', error);
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
};

