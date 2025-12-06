import { Document, Schema, model } from 'mongoose';

/**
 * Notification Types
 */
export type NotificationType =
    | 'job_posted'
    | 'application_submitted'
    | 'status_update'
    | 'application_rejected'
    | 'interview_scheduled'
    | 'offer_received'
    | 'placement_confirmed'
    | 'profile_update'
    | 'system_announcement'
    | 'other';

/**
 * Notification Document Interface
 */
export interface INotification extends Document {
    userId: Schema.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    relatedJob?: Schema.Types.ObjectId;
    relatedApplication?: Schema.Types.ObjectId;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Notification Schema Definition
 */
const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        type: {
            type: String,
            enum: [
                'job_posted',
                'application_submitted',
                'status_update',
                'application_rejected',
                'interview_scheduled',
                'offer_received',
                'placement_confirmed',
                'profile_update',
                'system_announcement',
                'other',
            ],
            required: [true, 'Notification type is required'],
        },
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true,
        },
        relatedJob: {
            type: Schema.Types.ObjectId,
            ref: 'Job',
            default: null,
        },
        relatedApplication: {
            type: Schema.Types.ObjectId,
            ref: 'Application',
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default model<INotification>('Notification', notificationSchema);
