import { Document, Schema, model } from 'mongoose';

export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'suspended';
export type Status = 'active' | 'inactive';

/**
 * College Document Interface
 */
export interface ICollege extends Document {
  name: string;
  location: string;
  code: string;
  adminId?: Schema.Types.ObjectId;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry?: Date;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * College Schema Definition
 */
const collegeSchema = new Schema<ICollege>(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'College location is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'College code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'expired', 'trial', 'suspended'],
      default: 'active',
    },
    subscriptionExpiry: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware
collegeSchema.pre('save', function (_next) {
  this.updatedAt = new Date();
  _next();
});

export default model<ICollege>('College', collegeSchema);
