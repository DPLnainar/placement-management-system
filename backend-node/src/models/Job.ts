import { Document, Schema, model } from 'mongoose';

/**
 * Job Document Interface
 */
export interface IEligibilityCriteria {
  minCGPA?: number;
  maxBacklogs?: number;
  allowedBranches?: string[];
  allowedYears?: number[];
  requiredSkills?: string[];
  experience?: string;
}

export interface IJob extends Document {
  title: string;
  company: string;
  description: string;
  salary?: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract';
  deadline: Date;
  registrationDeadline?: Date;
  deadlineExtended: boolean;
  originalDeadline?: Date;
  maxApplications?: number | null;
  currentApplicationCount: number;
  collegeId: Schema.Types.ObjectId;
  postedBy: Schema.Types.ObjectId;
  status: 'draft' | 'active' | 'inactive' | 'closed' | 'cancelled';
  eligibilityCriteria: IEligibilityCriteria;
  workLocation?: string;
  workMode?: 'onsite' | 'remote' | 'hybrid';
  companyTier?: string;
  jobCategory?: string;
  assessmentLink?: string;
  assessmentRequired: boolean;
  ctc?: number;
  baseSalary?: number;
  joiningBonus?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Job Schema Definition
 */
const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    salary: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'internship', 'contract'],
      default: 'full-time',
    },
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    deadlineExtended: {
      type: Boolean,
      default: false,
    },
    originalDeadline: {
      type: Date,
      default: null,
    },
    maxApplications: {
      type: Number,
      default: null,
    },
    currentApplicationCount: {
      type: Number,
      default: 0,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College assignment is required'],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'closed', 'cancelled'],
      default: 'active',
    },
    eligibilityCriteria: {
      minCGPA: { type: Number, default: 0 },
      maxBacklogs: { type: Number, default: null },
      allowedBranches: { type: [String], default: [] },
      allowedYears: { type: [Number], default: [] },
      requiredSkills: { type: [String], default: [] },
      experience: { type: String, default: '' },
    },
    workLocation: { type: String, default: '' },
    workMode: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      default: 'onsite',
    },
    companyTier: { type: String, default: '' },
    jobCategory: { type: String, default: '' },
    assessmentLink: { type: String, default: '' },
    assessmentRequired: { type: Boolean, default: false },
    ctc: { type: Number, default: 0 },
    baseSalary: { type: Number, default: 0 },
    joiningBonus: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
jobSchema.index({ collegeId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ deadline: 1 });
jobSchema.index({ collegeId: 1, status: 1 });

export default model<IJob>('Job', jobSchema);
