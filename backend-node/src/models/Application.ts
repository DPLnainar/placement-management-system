import { Document, Schema, model } from 'mongoose';

/**
 * Application Status Types
 */
export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'shortlisted'
  | 'aptitude_scheduled'
  | 'aptitude_cleared'
  | 'aptitude_rejected'
  | 'technical_scheduled'
  | 'technical_cleared'
  | 'technical_rejected'
  | 'hr_scheduled'
  | 'hr_cleared'
  | 'hr_rejected'
  | 'selected'
  | 'offered'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'joined'
  | 'rejected'
  | 'withdrawn';

export type RoundType = 'application' | 'aptitude' | 'technical' | 'hr' | 'final';
export type RoundInterviewType = 'aptitude' | 'technical' | 'hr' | 'gd' | 'other';
export type RoundStatus = 'scheduled' | 'completed' | 'cleared' | 'rejected' | 'absent';
export type Priority = 'low' | 'normal' | 'high';

/**
 * Interview Round Interface
 */
export interface IRound {
  roundName: string;
  roundType: RoundInterviewType;
  scheduledDate?: Date;
  completedDate?: Date;
  status: RoundStatus;
  score?: number;
  feedback?: string;
  interviewerName?: string;
  notes?: string;
  conductedBy?: Schema.Types.ObjectId;
}

/**
 * Eligibility Check Interface
 */
export interface IEligibilityCheck {
  isEligible: boolean | null;
  checkedBy?: Schema.Types.ObjectId;
  checkedDate?: Date;
  eligibilityIssues: string[];
  overrideReason?: string;
}

/**
 * Selection Details Interface
 */
export interface ISelectionDetails {
  selectedDate?: Date;
  selectedBy?: Schema.Types.ObjectId;
  offeredCTC?: number;
  offeredRole?: string;
  offerLetterSent: boolean;
  offerLetterDate?: Date;
  offerLetterUrl?: string;
  joiningDate?: Date;
  joiningLocation?: string;
}

/**
 * Notification Interface
 */
export interface INotification {
  type: string;
  sentAt: Date;
  sentBy?: Schema.Types.ObjectId;
  message?: string;
}

/**
 * Additional Document Interface
 */
export interface IAdditionalDocument {
  name?: string;
  url?: string;
  uploadedAt: Date;
}

/**
 * Application Document Interface
 */
export interface IApplication extends Document {
  jobId: Schema.Types.ObjectId;
  studentId: Schema.Types.ObjectId;
  collegeId: Schema.Types.ObjectId;
  status: ApplicationStatus;
  currentRound: RoundType;
  rounds: IRound[];
  eligibilityCheck: IEligibilityCheck;
  selectionDetails: ISelectionDetails;
  reviewedBy?: Schema.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  priority: Priority;
  isFlagged: boolean;
  flagReason?: string;
  notifications: INotification[];
  resumeSubmitted?: string;
  additionalDocuments: IAdditionalDocument[];
  appliedAt: Date;
  lastUpdatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  updateStatus(newStatus: ApplicationStatus, updatedBy: Schema.Types.ObjectId): Promise<IApplication>;
  addRound(roundData: IRound): Promise<IApplication>;
  sendNotification(
    type: string,
    message: string,
    sentBy?: Schema.Types.ObjectId
  ): Promise<IApplication>;
}

/**
 * Application Schema Definition
 */
const applicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
    },
    status: {
      type: String,
      enum: [
        'pending',
        'under_review',
        'shortlisted',
        'aptitude_scheduled',
        'aptitude_cleared',
        'aptitude_rejected',
        'technical_scheduled',
        'technical_cleared',
        'technical_rejected',
        'hr_scheduled',
        'hr_cleared',
        'hr_rejected',
        'selected',
        'offered',
        'offer_accepted',
        'offer_rejected',
        'joined',
        'rejected',
        'withdrawn',
      ],
      default: 'pending',
    },
    currentRound: {
      type: String,
      enum: ['application', 'aptitude', 'technical', 'hr', 'final'],
      default: 'application',
    },
    rounds: [
      {
        roundName: { type: String, required: true },
        roundType: {
          type: String,
          enum: ['aptitude', 'technical', 'hr', 'gd', 'other'],
          required: true,
        },
        scheduledDate: { type: Date, default: null },
        completedDate: { type: Date, default: null },
        status: {
          type: String,
          enum: ['scheduled', 'completed', 'cleared', 'rejected', 'absent'],
          default: 'scheduled',
        },
        score: { type: Number, default: null },
        feedback: { type: String, default: null },
        interviewerName: { type: String, default: null },
        notes: { type: String, default: null },
        conductedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      },
    ],
    eligibilityCheck: {
      isEligible: { type: Boolean, default: null },
      checkedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      checkedDate: { type: Date, default: null },
      eligibilityIssues: { type: [String], default: [] },
      overrideReason: { type: String, default: null },
    },
    selectionDetails: {
      selectedDate: { type: Date, default: null },
      selectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      offeredCTC: { type: Number, default: null },
      offeredRole: { type: String, default: null },
      offerLetterSent: { type: Boolean, default: false },
      offerLetterDate: { type: Date, default: null },
      offerLetterUrl: { type: String, default: null },
      joiningDate: { type: Date, default: null },
      joiningLocation: { type: String, default: null },
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: null },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: null },
    notifications: [
      {
        type: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        sentBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        message: { type: String, default: null },
      },
    ],
    resumeSubmitted: { type: String, default: null },
    additionalDocuments: [
      {
        name: { type: String, default: null },
        url: { type: String, default: null },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    appliedAt: { type: Date, default: Date.now },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
// Additional indexes for efficient queries
applicationSchema.index({ collegeId: 1, status: 1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ studentId: 1, status: 1 });
applicationSchema.index({ collegeId: 1, currentRound: 1 });

/**
 * Update application status
 */
applicationSchema.methods.updateStatus = async function (
  newStatus: ApplicationStatus,
  updatedBy: Schema.Types.ObjectId
): Promise<IApplication> {
  this.status = newStatus;
  this.lastUpdatedBy = updatedBy;
  return this.save();
};

/**
 * Add interview round
 */
applicationSchema.methods.addRound = async function (roundData: IRound): Promise<IApplication> {
  this.rounds.push(roundData);
  return this.save();
};

/**
 * Send notification to student
 */
applicationSchema.methods.sendNotification = async function (
  type: string,
  message: string,
  sentBy?: Schema.Types.ObjectId
): Promise<IApplication> {
  this.notifications.push({ type, sentAt: new Date(), message, sentBy });
  return this.save();
};

export default model<IApplication>('Application', applicationSchema);
