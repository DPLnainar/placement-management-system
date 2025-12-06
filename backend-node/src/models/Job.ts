import { Document, Schema, model } from 'mongoose';

/**
 * Hiring Round Interface
 */
export interface IHiringRound {
  roundName: string;
  roundType?: string;
  description?: string;
}

/**
 * Job Attachment Interface
 */
export interface IJobAttachment {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  uploadedAt: Date;
}

/**
 * Custom Department Rules Interface
 */
export interface ICustomDeptRule {
  department: string;
  minCGPA?: number;
  minTenthPct?: number;
  minTwelfthPct?: number;
  allowArrears?: boolean;
}

/**
 * Eligibility Criteria Interface
 */
export interface IEligibilityCriteria {
  tenthPct?: number;
  twelfthPct?: number;
  cgpa?: number;
  allowArrears: boolean;
  deptList: string[];
  customDeptRules: ICustomDeptRule[];
  minCGPA?: number;
  maxBacklogs?: number;
  allowedBranches?: string[];
  allowedYears?: number[];
  requiredSkills?: string[];
  experience?: string;
}

/**
 * Notification Channels Interface
 */
export interface INotifyChannels {
  email: boolean;
  whatsapp: boolean;
}

/**
 * Job Document Interface
 * Represents a job posting or internship opportunity
 */
export interface IJob extends Document {
  /** Job title/position */
  title: string;
  /** Company name */
  companyName: string;
  /** Job category: internship or full-time */
  category: ('intern' | 'fulltime')[];
  /** Job description */
  description: string;
  /** Salary range (legacy field) */
  salary?: string;
  /** Annual package in lakhs (LPA) */
  packageLPA?: number;
  /** Monthly stipend for internships */
  stipend?: number;
  /** Internship duration in months */
  durationMonths?: number;
  /** Job role/position */
  role: string;
  /** Skills required for the job */
  skillsRequired: string[];
  /** Hiring process rounds */
  hiringRounds: IHiringRound[];
  /** Job-related attachments */
  attachments: IJobAttachment[];
  /** Job location */
  location: string;
  /** Job type */
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract';
  /** Application deadline */
  deadline: Date;
  /** Registration deadline */
  registrationDeadline?: Date;
  /** Whether deadline was extended */
  deadlineExtended: boolean;
  /** Original deadline before extension */
  originalDeadline?: Date;
  /** Maximum number of applications allowed */
  maxApplications?: number | null;
  /** Current application count */
  currentApplicationCount: number;
  /** College reference (nullable for global jobs) */
  collegeId?: Schema.Types.ObjectId | null;
  /** User who posted the job */
  postedBy: Schema.Types.ObjectId;
  /** Job status */
  status: 'draft' | 'active' | 'inactive' | 'closed' | 'cancelled';
  /** Eligibility criteria */
  eligibility: IEligibilityCriteria;
  /** Work location */
  workLocation?: string;
  /** Work mode */
  workMode?: 'onsite' | 'remote' | 'hybrid';
  /** Company tier classification */
  companyTier?: string;
  /** Job category classification */
  jobCategory?: string;
  /** Assessment link */
  assessmentLink?: string;
  /** Whether assessment is required */
  assessmentRequired: boolean;
  /** Cost to company */
  ctc?: number;
  /** Base salary component */
  baseSalary?: number;
  /** Joining bonus */
  joiningBonus?: number;
  /** Whether job is active */
  isActive: boolean;
  /** Notification channel preferences */
  notifyChannels: INotifyChannels;
  /** User who created the job */
  createdBy: Schema.Types.ObjectId;
  /** Record creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Job Schema Definition
 * Comprehensive job posting schema with eligibility and notification settings
 */
const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    category: {
      type: [String],
      enum: ['intern', 'fulltime'],
      required: [true, 'Job category is required'],
      default: ['fulltime'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    salary: {
      type: String,
      trim: true,
    },
    packageLPA: {
      type: Number,
      min: [0, 'Package cannot be negative'],
    },
    stipend: {
      type: Number,
      min: [0, 'Stipend cannot be negative'],
    },
    durationMonths: {
      type: Number,
      min: [1, 'Duration must be at least 1 month'],
      max: [24, 'Duration cannot exceed 24 months'],
    },
    role: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    hiringRounds: [
      {
        roundName: { type: String, required: true },
        roundType: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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
      default: null,
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
    eligibility: {
      tenthPct: { type: Number, min: 0, max: 100 },
      twelfthPct: { type: Number, min: 0, max: 100 },
      cgpa: { type: Number, min: 0, max: 10 },
      allowArrears: { type: Boolean, default: false },
      deptList: { type: [String], default: [] },
      customDeptRules: [
        {
          department: { type: String, required: true },
          minCGPA: { type: Number, min: 0, max: 10 },
          minTenthPct: { type: Number, min: 0, max: 100 },
          minTwelfthPct: { type: Number, min: 0, max: 100 },
          allowArrears: { type: Boolean, default: false },
        },
      ],
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
    isActive: { type: Boolean, default: true },
    notifyChannels: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
    },
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
jobSchema.index({ category: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ companyName: 1 });
jobSchema.index({ createdBy: 1 });

// Performance-critical compound indexes
jobSchema.index({ collegeId: 1, status: 1, deadline: 1 }); // Active jobs query
jobSchema.index({ collegeId: 1, isActive: 1, deadline: 1 }); // Eligible jobs
jobSchema.index({ status: 1, deadline: 1 }); // Deadline-based queries

export default model<IJob>('Job', jobSchema);

