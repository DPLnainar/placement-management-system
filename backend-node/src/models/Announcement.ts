import { Document, Schema, model } from 'mongoose';

export type AnnouncementType = 'general' | 'placement' | 'job' | 'event' | 'urgent' | 'maintenance';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TargetAudience = 'all' | 'students' | 'placed_students' | 'unplaced_students' | 'specific_branch' | 'specific_year';

export interface IAttachment {
  name?: string;
  url?: string;
  type?: string;
  size?: number;
}

export interface IViewedBy {
  userId?: Schema.Types.ObjectId;
  viewedAt: Date;
}

/**
 * Announcement Document Interface
 */
export interface IAnnouncement extends Document {
  title: string;
  content: string;
  collegeId: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  type: AnnouncementType;
  priority: Priority;
  targetAudience: TargetAudience;
  targetBranches: string[];
  targetYears: number[];
  isPublished: boolean;
  publishDate?: Date;
  expiryDate?: Date;
  isPinned: boolean;
  attachments: IAttachment[];
  relatedJobId?: Schema.Types.ObjectId;
  relatedDriveId?: Schema.Types.ObjectId;
  views: number;
  viewedBy: IViewedBy[];
  sendEmailNotification: boolean;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  isActive(): boolean;
  hasUserViewed(userId: Schema.Types.ObjectId): boolean;
  markAsViewed(userId: Schema.Types.ObjectId): Promise<void>;
}

/**
 * Announcement Schema Definition
 */
const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['general', 'placement', 'job', 'event', 'urgent', 'maintenance'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    targetAudience: {
      type: String,
      enum: [
        'all',
        'students',
        'placed_students',
        'unplaced_students',
        'specific_branch',
        'specific_year',
      ],
      default: 'all',
    },
    targetBranches: { type: [String], default: [] },
    targetYears: { type: [Number], default: [] },
    isPublished: { type: Boolean, default: false },
    publishDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    isPinned: { type: Boolean, default: false },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        size: { type: Number },
      },
    ],
    relatedJobId: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
    relatedDriveId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      default: null,
    },
    views: { type: Number, default: 0 },
    viewedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    sendEmailNotification: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ collegeId: 1, isPublished: 1 });
announcementSchema.index({ collegeId: 1, isPinned: 1 });
announcementSchema.index({ createdAt: -1 });

announcementSchema.pre('save', function (_next) {
  this.updatedAt = new Date();
  _next();
});

announcementSchema.methods.isActive = function (): boolean {
  const now = new Date();
  if (!this.isPublished) return false;
  if (this.publishDate && now < this.publishDate) return false;
  if (this.expiryDate && now > this.expiryDate) return false;
  return true;
};

announcementSchema.methods.hasUserViewed = function (
  userId: Schema.Types.ObjectId
): boolean {
  return this.viewedBy.some(
    (v: any) => v.userId.toString() === userId.toString()
  );
};

announcementSchema.methods.markAsViewed = async function (
  userId: Schema.Types.ObjectId
): Promise<void> {
  if (!this.hasUserViewed(userId)) {
    this.viewedBy.push({ userId, viewedAt: new Date() });
    this.views += 1;
    await this.save();
  }
};

export default model<IAnnouncement>('Announcement', announcementSchema);
