import { Document, Schema, model } from 'mongoose';

export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'suspended';
export type Status = 'active' | 'inactive';

/**
 * Contact Information Interface
 */
export interface ICollegeContact {
  phone: string;
  email: string;
  website?: string;
}

/**
 * College Document Interface
 * Represents a college/institution in the placement system
 */
export interface ICollege extends Document {
  /** College name */
  name: string;
  /** College unique code (e.g., "MIT", "STANFORD") */
  code: string;
  /** City or town location */
  place: string;
  /** Full postal address */
  address: string;
  /** Contact information */
  contact: ICollegeContact;
  /** Reference to admin user managing this college */
  adminUserId?: Schema.Types.ObjectId;
  /** Subscription status for the college */
  subscriptionStatus: SubscriptionStatus;
  /** Subscription expiry date */
  subscriptionExpiry?: Date;
  /** Active/inactive status */
  status: Status;
  /** Record creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
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
    code: {
      type: String,
      required: [true, 'College code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    place: {
      type: String,
      required: [true, 'College place/city is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'College address is required'],
      trim: true,
    },
    contact: {
      phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
        match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'],
      },
      email: {
        type: String,
        required: [true, 'Contact email is required'],
        trim: true,
        lowercase: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please enter a valid email',
        ],
      },
      website: {
        type: String,
        trim: true,
        default: '',
      },
    },
    adminUserId: {
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


// Indexes for efficient queries


collegeSchema.index({ adminUserId: 1 });
collegeSchema.index({ status: 1 });

// Pre-save middleware
collegeSchema.pre('save', function (_next) {
  this.updatedAt = new Date();
  _next();
});

export default model<ICollege>('College', collegeSchema);

