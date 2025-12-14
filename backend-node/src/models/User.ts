import { Document, Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Document Interface
 * Represents a user in the placement system
 */
export interface IUser extends Document {
  /** Unique username for login */
  username: string;
  /** User's email address */
  email: string;
  /** Hashed password (stored securely, never plain text) */
  password: string;
  /** Full name of the user */
  fullName: string;
  /** User role in the system */
  role: 'superadmin' | 'admin' | 'moderator' | 'student';
  /** Reference to college (required for non-superadmin users) */
  collegeId?: Schema.Types.ObjectId;
  /** User who assigned/created this user */
  assignedBy?: Schema.Types.ObjectId | null;
  /** Account status */
  status: 'active' | 'inactive' | 'pending';
  /** Whether user is approved by admin */
  isApproved: boolean;
  /** Department/branch (for students and moderators) */
  department?: string;
  /** Primary phone number */
  phone?: string;
  /** Profile photo URL (Cloudinary or other storage) */
  photoUrl?: string;
  /** Reference to academic profile (StudentData) */
  academicProfileId?: Schema.Types.ObjectId;
  /** Reference to personal profile (StudentData) - same as academic for students */
  personalProfileId?: Schema.Types.ObjectId;
  /** Password reset token */
  resetPasswordToken?: string;
  /** Password reset token expiry */
  resetPasswordExpire?: Date;
  /** Last login timestamp */
  lastLogin?: Date;
  /** Failed login attempts counter */
  failedAttempts: number;
  /** Account lock timestamp */
  accountLockedUntil?: Date;
  /** Whether account is active */
  isActive: boolean;
  /** Whether account is blocked by moderator/admin */
  isBlocked: boolean;
  /** User who blocked this account */
  blockedBy?: Schema.Types.ObjectId;
  /** When the account was blocked */
  blockedAt?: Date;
  /** Reason for blocking the account */
  blockReason?: string;
  /** Refresh token for JWT */
  refreshToken?: string;
  primaryEmail?: string;
  secondaryEmail?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  address?: string;
  passportNumber?: string;
  /** Record creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  // Methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
}

/**
 * User Schema Definition
 * Stores user authentication and profile information
 */
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: { type: String, required: true, index: true },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'moderator', 'student'],
      required: [true, 'Role is required'],
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: function (this: IUser) {
        return this.role !== 'superadmin'; // Not required for SuperAdmin
      },
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'],
      default: '',
    },
    photoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    academicProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentData',
      default: null,
    },
    personalProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentData',
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpire: {
      type: Date,
      default: undefined,
    },
    lastLogin: {
      type: Date,
      default: undefined,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
    blockedAt: {
      type: Date,
      default: undefined,
    },
    blockReason: {
      type: String,
      trim: true,
      default: undefined,
    },
    refreshToken: {
      type: String,
      select: false, // Don't return refresh token by default
      default: undefined,
    },
    primaryEmail: { type: String, trim: true, default: '' },
    secondaryEmail: { type: String, trim: true, default: '' },
    primaryPhone: { type: String, trim: true, default: '' },
    secondaryPhone: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, trim: true, default: '' },
    nationality: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    passportNumber: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes for efficient queries
 */
userSchema.index({ username: 1 });
userSchema.index({ collegeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ collegeId: 1, role: 1 });

/**
 * Middleware: Hash password before saving
 */
userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Method: Compare passwords
 */
userSchema.methods.matchPassword = async function (
  this: IUser,
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * Method: Compare passwords (alias for matchPassword)
 * Used by authController
 */
userSchema.methods.comparePassword = async function (
  this: IUser,
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * Method: Generate password reset token
 */
userSchema.methods.getResetPasswordToken = function (this: IUser): string {
  // Generate token
  const resetToken = require('crypto').randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time to 10 minutes
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

export default model<IUser>('User', userSchema);
