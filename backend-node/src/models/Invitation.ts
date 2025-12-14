import { Document, Schema, model } from 'mongoose';
import crypto from 'crypto';

export type InvitationStatus = 'pending' | 'registered' | 'expired' | 'cancelled';

/**
 * Invitation Document Interface
 */
export interface IInvitation extends Document {
  email: string;
  token: string;
  fullName: string;
  rollNumber?: string;
  department: string;
  college: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  status: InvitationStatus;
  expiresAt: Date;
  registeredAt?: Date;
  registeredUser?: Schema.Types.ObjectId;
  emailSent: boolean;
  emailSentAt?: Date;
  resendCount: number;
  lastResentAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  generateToken(): string;
  isValid(): boolean;
  checkExpiration(): Promise<IInvitation>;
  registrationLink: string;
}

/**
 * Invitation Schema Definition
 */
const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email',
      ],
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    college: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'registered', 'expired', 'cancelled'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    registeredAt: { type: Date },
    registeredUser: { type: Schema.Types.ObjectId, ref: 'User' },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    resendCount: { type: Number, default: 0 },
    lastResentAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ email: 1, college: 1 });
invitationSchema.index({ status: 1 });

/**
 * Generate random token
 */
invitationSchema.methods.generateToken = function (): string {
  this.token = crypto.randomBytes(32).toString('hex');
  return this.token;
};

/**
 * Check if invitation is valid
 */
invitationSchema.methods.isValid = function (): boolean {
  return this.status === 'pending' && this.expiresAt > new Date();
};

/**
 * Check and update expiration
 */
invitationSchema.methods.checkExpiration = async function (): Promise<IInvitation> {
  if (this.status === 'pending' && this.expiresAt <= new Date()) {
    this.status = 'expired';
    await this.save();
  }
  return this as IInvitation;
};

/**
 * Registration link virtual
 */
invitationSchema.virtual('registrationLink').get(function (this: IInvitation) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/register/${this.token}`;
});

invitationSchema.set('toJSON', { virtuals: true });
invitationSchema.set('toObject', { virtuals: true });

export default model<IInvitation>('Invitation', invitationSchema);
