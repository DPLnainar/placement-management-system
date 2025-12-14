import { Request, Response } from 'express';
import Application from '../models/Application';
import StudentData from '../models/StudentData';
import Job from '../models/Job';
import { checkEligibility } from '../services/eligibilityService';
import sendEmail from '../utils/sendEmail';
import { sendNotification } from '../services/notificationService';

/**
 * Create Application (Student Only)
 * Checks placement lock and eligibility before creating application
 */
export const createApplication = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.body;
        const userId = (req as any).user._id;
        const collegeId = (req as any).user.collegeId;

        // Validate job ID
        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: 'Job ID is required',
            });
        }

        // Check if job exists and is active
        const job = await Job.findById(jobId) as any;
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (!job.isActive || job.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'This job is no longer accepting applications',
            });
        }

        // Get student data
        const student = await StudentData.findOne({ userId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found. Please complete your profile first.',
            });
        }

        // PLACEMENT LOCK CHECK
        if (student.placement.placed) {
            return res.status(403).json({
                success: false,
                message: 'You are already placed and cannot apply to new jobs',
                placementDetails: {
                    company: student.placement.companyName,
                    placedAt: student.placement.placedAt,
                },
            });
        }

        // VERIFICATION STATUS CHECK
        if (student.verificationStatus !== 'VERIFIED') {
            const statusMessages = {
                'PENDING': 'Your profile is pending verification. Please wait for moderator approval before applying to jobs.',
                'REJECTED': `Your profile verification was rejected. Reason: ${student.verificationRejectionReason || 'Not specified'}. Please contact your department moderator.`
            };

            return res.status(403).json({
                success: false,
                message: statusMessages[student.verificationStatus] || 'Profile verification required',
                verificationStatus: student.verificationStatus,
                verificationRejectionReason: student.verificationRejectionReason
            });
        }

        // Check if already applied
        const existingApplication = await Application.findOne({ jobId, studentId: userId });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to this job',
            });
        }

        // ELIGIBILITY CHECK
        const eligibility = checkEligibility(student, job);
        if (!eligibility.eligible) {
            return res.status(403).json({
                success: false,
                message: 'You are not eligible for this job',
                reasons: eligibility.reasons,
            });
        }

        // Create application
        const application = new Application({
            jobId,
            studentId: userId,
            collegeId,
            status: 'pending',
            currentRound: 'application',
            eligibilityCheck: {
                isEligible: true,
                checkedDate: new Date(),
                eligibilityIssues: [],
            },
            resumeSubmitted: student.resumeUrl || student.resume.resumeUrl,
            appliedAt: new Date(),
        });

        await application.save();

        // Send email notification to student
        try {
            await sendEmail({
                to: (req as any).user.email,
                subject: 'Application Submitted Successfully',
                html: `
          <h2>Application Submitted</h2>
          <p>Your application for <strong>${job.title}</strong> at <strong>${job.company}</strong> has been submitted successfully.</p>
          <p>You will be notified about further updates.</p>
        `,
                text: `Your application for ${job.title} at ${job.company} has been submitted successfully. You will be notified about further updates.`,
            });
        } catch (emailError) {
            console.error('Failed to send application confirmation email:', emailError);
        }

        // Create notification
        try {
            await sendNotification({
                userId,
                type: 'application_submitted',
                title: 'Application Submitted',
                message: `Your application for ${job.title} at ${job.company} has been submitted successfully`,
                relatedJob: jobId as any,
                relatedApplication: application._id as any,
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application,
        });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Get Applications
 * Students see their own, Admins/Moderators see all for their college
 */
export const getApplications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const userRole = (req as any).user.role;
        const collegeId = (req as any).user.collegeId;

        let query: any = {};

        if (userRole === 'student') {
            // Students see only their applications
            query.studentId = userId;
        } else if (userRole === 'admin' || userRole === 'moderator') {
            // Admins/Moderators see all applications for their college
            query.collegeId = collegeId;
        } else {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const applications = await Application.find(query)
            .populate('jobId', 'title company ctc location jobType')
            .populate('studentId', 'name email')
            .sort({ appliedAt: -1 });

        res.json({
            success: true,
            count: applications.length,
            applications,
        });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Update Application Status (Admin/Moderator Only)
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, roundData } = req.body;
        const userId = (req as any).user._id;

        const application = await Application.findById(id).populate('studentId', 'email name');
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Update status
        application.status = status;
        application.lastUpdatedBy = userId;

        const { currentRoundIndex } = req.body;
        if (typeof currentRoundIndex === 'number') {
            application.currentRoundIndex = currentRoundIndex;
        }

        // Add round if provided
        if (roundData) {
            application.rounds.push(roundData);
            application.currentRound = roundData.roundType;
        }

        await application.save();

        // AUTO-POPULATE OFFERS: When status changes to OFFERED, add offer to student's offers array
        if (status.toUpperCase() === 'OFFERED' || status === 'offered') {
            try {
                const job = await Job.findById(application.jobId) as any;

                await StudentData.updateOne(
                    { userId: application.studentId },
                    {
                        $push: {
                            allOffers: {
                                jobId: application.jobId,
                                companyName: job?.company || 'Unknown Company',
                                package: job?.ctc || job?.salary || 0,
                                offerDate: new Date(),
                                offerLetterUrl: application.selectionDetails?.offerLetterUrl || '',
                                status: 'pending',
                            },
                        },
                    }
                );

                console.log(`Offer added to student ${application.studentId} for ${job?.company}`);
            } catch (offerError) {
                console.error('Failed to add offer to student:', offerError);
                // Don't fail the entire request if offer addition fails
            }
        }

        // PLACEMENT LOCK: If status is PLACED, update student placement data
        if (status.toUpperCase() === 'PLACED' || status === 'offer_accepted' || status === 'joined') {
            try {
                const job = await Job.findById(application.jobId) as any;

                await StudentData.updateOne(
                    { userId: application.studentId },
                    {
                        $set: {
                            'placement.placed': true,
                            'placement.jobId': application.jobId,
                            'placement.companyName': job?.company || 'Unknown Company',
                            'placement.package': job?.ctc || job?.salary || 0,
                            'placement.placedAt': new Date(),
                        },
                    }
                );

                console.log(`Student ${application.studentId} marked as placed at ${job?.company}`);
            } catch (placementError) {
                console.error('Failed to update student placement data:', placementError);
                // Don't fail the entire request if placement update fails
            }
        }

        // Send notification to student
        try {
            const job = await Job.findById(application.jobId) as any;
            const studentUser = application.studentId as any;

            await sendEmail({
                to: studentUser.email,
                subject: 'Application Status Update',
                html: `
          <h2>Application Status Updated</h2>
          <p>Dear ${studentUser.name},</p>
          <p>Your application for <strong>${job?.title}</strong> at <strong>${job?.company}</strong> has been updated.</p>
          <p><strong>New Status:</strong> ${status}</p>
          ${roundData ? `<p><strong>Round:</strong> ${roundData.roundName}</p>` : ''}
        `,
                text: `Dear ${studentUser.name}, Your application for ${job?.title} at ${job?.company} has been updated. New Status: ${status}`,
            });

            await sendNotification({
                userId: application.studentId as any,
                type: 'status_update',
                title: 'Application Status Updated',
                message: `Your application status has been updated to: ${status}`,
                relatedJob: application.jobId as any,
                relatedApplication: application._id as any,
            });
        } catch (notifError) {
            console.error('Failed to send status update notification:', notifError);
        }

        res.json({
            success: true,
            message: 'Application status updated successfully',
            application,
        });
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Add Rejection Reason (Admin/Moderator Only)
 */
export const addRejectionReason = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        const userId = (req as any).user._id;

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required',
            });
        }

        const application = await Application.findById(id).populate('studentId', 'email name');
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        application.rejectionReason = rejectionReason;
        application.status = 'rejected';
        application.lastUpdatedBy = userId;
        await application.save();

        // Send notification to student
        try {
            const job = await Job.findById(application.jobId) as any;
            const studentUser = application.studentId as any;

            await sendEmail({
                to: studentUser.email,
                subject: 'Application Update',
                html: `
          <h2>Application Status Update</h2>
          <p>Dear ${studentUser.name},</p>
          <p>Thank you for your interest in <strong>${job?.title}</strong> at <strong>${job?.company}</strong>.</p>
          <p>Unfortunately, we are unable to proceed with your application at this time.</p>
          <p><strong>Reason:</strong> ${rejectionReason}</p>
          <p>We encourage you to apply for other opportunities.</p>
        `,
                text: `Dear ${studentUser.name}, Thank you for your interest in ${job?.title} at ${job?.company}. Unfortunately, we are unable to proceed with your application at this time. Reason: ${rejectionReason}`,
            });

            await sendNotification({
                userId: application.studentId as any,
                type: 'application_rejected',
                title: 'Application Update',
                message: `Your application has been rejected. Reason: ${rejectionReason}`,
                relatedJob: application.jobId as any,
                relatedApplication: application._id as any,
            });
        } catch (notifError) {
            console.error('Failed to send rejection notification:', notifError);
        }

        res.json({
            success: true,
            message: 'Rejection reason added successfully',
            application,
        });
    } catch (error) {
        console.error('Add rejection reason error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
