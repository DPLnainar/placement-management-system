import { Document, Schema, model } from 'mongoose';

/**
 * Moderator Document Interface
 * Represents a moderator user with department-specific permissions
 * Links to a User document with role='moderator'
 */
export interface IModerator extends Document {
    /** Reference to User document */
    userId: Schema.Types.ObjectId;
    /** Reference to College */
    collegeId: Schema.Types.ObjectId;
    /** Array of departments this moderator manages */
    departments: string[];
    /** Whether moderator is currently active */
    isActive: boolean;
    /** Specific permissions granted to this moderator */
    permissions?: string[];
    /** User who assigned this moderator role */
    assignedBy?: Schema.Types.ObjectId;
    /** Record creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
}

/**
 * Moderator Schema Definition
 * Stores moderator-specific data separate from User model
 */
const moderatorSchema = new Schema<IModerator>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            unique: true,
        },
        collegeId: {
            type: Schema.Types.ObjectId,
            ref: 'College',
            required: [true, 'College reference is required'],
        },
        departments: {
            type: [String],
            required: [true, 'At least one department is required'],
            validate: {
                validator: function (v: string[]) {
                    return v && v.length > 0;
                },
                message: 'Departments array cannot be empty',
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        permissions: {
            type: [String],
            default: [],
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Indexes for efficient queries
 */
moderatorSchema.index({ userId: 1 }, { unique: true });
moderatorSchema.index({ collegeId: 1 });
moderatorSchema.index({ collegeId: 1, isActive: 1 });
moderatorSchema.index({ departments: 1 });

export default model<IModerator>('Moderator', moderatorSchema);
