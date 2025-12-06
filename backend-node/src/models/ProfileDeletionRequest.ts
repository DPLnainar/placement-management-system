import { Document, Schema, model } from 'mongoose';

/**
 * Profile Deletion Request Status
 */
export type DeletionStatus = 'pending' | 'approved' | 'rejected';

/**
 * Profile Deletion Request Document Interface
 */
export interface IProfileDeletionRequest extends Document {
    studentId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    reason: string;
    status: DeletionStatus;
    requestedAt: Date;
    processedBy?: Schema.Types.ObjectId;
    processedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Profile Deletion Request Schema
 */
const profileDeletionRequestSchema = new Schema<IProfileDeletionRequest>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'StudentData',
            required: [true, 'Student ID is required'],
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        reason: {
            type: String,
            required: [true, 'Deletion reason is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        processedAt: {
            type: Date,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
profileDeletionRequestSchema.index({ userId: 1, status: 1 });
profileDeletionRequestSchema.index({ status: 1, requestedAt: -1 });

export default model<IProfileDeletionRequest>('ProfileDeletionRequest', profileDeletionRequestSchema);
