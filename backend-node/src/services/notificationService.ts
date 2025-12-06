import Notification from '../models/Notification';
import { sendEmail } from '../utils/sendEmail';
import StudentData from '../models/StudentData';
import Job from '../models/Job';
import User from '../models/User';
import { Schema } from 'mongoose';

/**
 * Notification Service
 * Handles creation and management of notifications
 */

interface NotificationData {
    userId: Schema.Types.ObjectId | string;
    type: string;
    title: string;
    message: string;
    relatedJob?: Schema.Types.ObjectId | string;
    relatedApplication?: Schema.Types.ObjectId | string;
}

/**
 * Send notification to user
 * Creates notification in database
 */
export const sendNotification = async (data: NotificationData) => {
    try {
        const notification = new Notification({
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            relatedJob: data.relatedJob,
            relatedApplication: data.relatedApplication,
            isRead: false,
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        throw error;
    }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (
    userId: Schema.Types.ObjectId | string,
    limit: number = 50
) => {
    try {
        const notifications = await Notification.find({ userId })
            .populate('relatedJob', 'title company')
            .populate('relatedApplication', 'status')
            .sort({ createdAt: -1 })
            .limit(limit);

        return notifications;
    } catch (error) {
        console.error('Failed to get notifications:', error);
        throw error;
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: Schema.Types.ObjectId | string) => {
    try {
        const count = await Notification.countDocuments({ userId, isRead: false });
        return count;
    } catch (error) {
        console.error('Failed to get unread count:', error);
        throw error;
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string, userId: Schema.Types.ObjectId | string) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        return notification;
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: Schema.Types.ObjectId | string) => {
    try {
        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    } catch (error) {
        console.error('Failed to mark all as read:', error);
        throw error;
    }
};

/**
 * Notify eligible students about new job posting
 */
export const notifyEligibleStudents = async (jobId: Schema.Types.ObjectId | string) => {
    try {
        const job = await Job.findById(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        // Get all students from the same college
        const students = await StudentData.find({
            collegeId: job.collegeId,
            'placement.placed': false, // Only notify students who are not placed
        }).populate('userId', 'email');

        const eligibleStudents: any[] = [];

        // Import eligibility service
        const { checkEligibility } = await import('./eligibilityService');

        // Check eligibility for each student
        for (const student of students) {
            const eligibility = checkEligibility(student, job);
            if (eligibility.eligible) {
                eligibleStudents.push(student);
            }
        }

        console.log(`Found ${eligibleStudents.length} eligible students for job: ${job.title}`);

        // Send notifications and emails to eligible students
        for (const student of eligibleStudents) {
            try {
                // Create notification
                await sendNotification({
                    userId: student.userId,
                    type: 'job_posted',
                    title: 'New Job Opportunity',
                    message: `A new job opportunity for ${job.title} at ${job.company} has been posted. You are eligible to apply!`,
                    relatedJob: jobId,
                });

                // Send email
                const user = student.userId as any;
                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: 'New Job Opportunity - You are Eligible!',
                        html: `
              <h2>New Job Opportunity</h2>
              <p>Dear ${student.personal?.name || 'Student'},</p>
              <p>A new job opportunity has been posted that matches your profile:</p>
              <ul>
                <li><strong>Position:</strong> ${job.title}</li>
                <li><strong>Company:</strong> ${job.company}</li>
                <li><strong>CTC:</strong> ₹${job.ctc} LPA</li>
                <li><strong>Location:</strong> ${job.location}</li>
              </ul>
              <p>You are eligible to apply for this position. Login to your portal to apply now!</p>
            `,
                    });
                }
            } catch (error) {
                console.error(`Failed to notify student ${student.userId}:`, error);
            }
        }

        return eligibleStudents.length;
    } catch (error) {
        console.error('Failed to notify eligible students:', error);
        throw error;
    }
};

/**
 * Delete old notifications (cleanup)
 */
export const deleteOldNotifications = async (daysOld: number = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await Notification.deleteMany({
            createdAt: { $lt: cutoffDate },
            isRead: true,
        });

        console.log(`Deleted ${result.deletedCount} old notifications`);
        return result.deletedCount;
    } catch (error) {
        console.error('Failed to delete old notifications:', error);
        throw error;
    }
};
