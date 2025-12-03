import { Document, Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Document Interface
 * Represents a user in the placement system
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'moderator' | 'student';
  collegeId?: Schema.Types.ObjectId;
  assignedBy?: Schema.Types.ObjectId | null;
  status: 'active' | 'inactive' | 'pending';
  isApproved: boolean;
  department?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  primaryEmail?: string;
  secondaryEmail?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  address?: string;
  passportNumber?: string;
  createdAt: Date;
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
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
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
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpire: {
      type: Date,
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
