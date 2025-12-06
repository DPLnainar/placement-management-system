import { Document, Schema, model } from 'mongoose';
import crypto from 'crypto';

/**
 * Password Reset Token Document Interface
 * Tracks password reset tokens for secure password recovery
 */
export interface IPasswordResetToken extends Document {
    /** Reference to User requesting password reset */
    userId: Schema.Types.ObjectId;
    /** Hashed reset token */
    tokenHash: string;
    /** Token expiration timestamp */
    expiresAt: Date;
    /** Whether token has been used */
    used: boolean;
    /** Timestamp when token was used */
    usedAt?: Date;
    /** IP address of requester (security tracking) */
    ipAddress?: string;
    /** User agent of requester (security tracking) */
    userAgent?: string;
    /** Record creation timestamp */
    createdAt: Date;

    /** Check if token is valid (not expired and not used) */
    isValid(): boolean;
    /** Mark token as used */
    markAsUsed(): Promise<IPasswordResetToken>;
}

/**
 * Password Reset Token Schema Definition
 * Manages password reset tokens separately from User model
 */
const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
        },
        tokenHash: {
            type: String,
            required: [true, 'Token hash is required'],
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: [true, 'Expiration date is required'],
            index: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
        usedAt: {
            type: Date,
            default: null,
        },
        ipAddress: {
            type: String,
            trim: true,
            default: '',
        },
        userAgent: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

/**
 * Indexes for efficient queries
 */
passwordResetTokenSchema.index({ tokenHash: 1 }, { unique: true });
passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 });
passwordResetTokenSchema.index({ userId: 1, used: 1 });

/**
 * Method: Check if token is valid
 */
passwordResetTokenSchema.methods.isValid = function (): boolean {
    return !this.used && this.expiresAt > new Date();
};

/**
 * Method: Mark token as used
 */
passwordResetTokenSchema.methods.markAsUsed = async function (): Promise<IPasswordResetToken> {
    this.used = true;
    this.usedAt = new Date();
    return this.save();
};

/**
 * Static method: Generate token hash
 */
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Static method: Generate random token
 */
export const generateToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

export default model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);
