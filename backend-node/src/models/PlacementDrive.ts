import { Document, Schema, model } from 'mongoose';

export type DriveStatus = 'draft' | 'upcoming' | 'active' | 'paused' | 'completed' | 'cancelled';
export type DriveType = 'main_placement' | 'summer_internship' | 'winter_internship' | 'pool_campus' | 'off_campus';
export type CoordinatorRole = 'primary' | 'secondary' | 'department';

export interface IPolicy {
  oneOfferRule?: { enabled: boolean; description?: string };
  dreamCompanyRule?: {
    enabled: boolean;
    allowMultipleApplications?: boolean;
    description?: string;
  };
  maxApplicationsPerStudent?: number;
  postPlacementRules?: {
    canApplyAfterPlacement?: boolean;
    onlyHigherCTC?: boolean;
    minCTCDifference?: number;
  };
  globalCriteria?: { minCGPA?: number; maxBacklogs?: number };
}

export interface ITargets {
  targetPlacementPercentage?: number;
  targetCompaniesCount?: number;
  totalStudentsEligible?: number;
}

export interface IStatistics {
  totalJobsPosted: number;
  totalApplications: number;
  totalStudentsPlaced: number;
  totalOffersRolledOut: number;
  averageCTC: number;
  highestCTC: number;
  lowestCTC: number;
  placementPercentage: number;
}

export interface ICoordinator {
  userId?: Schema.Types.ObjectId;
  role?: CoordinatorRole;
  department?: string;
}

export interface IAnnouncement {
  title: string;
  message: string;
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  priority?: string;
  targetAudience?: string;
}

export interface IImportantDate {
  event: string;
  date: Date;
  description?: string;
}

export interface ICompanyRestrictions {
  blacklistedCompanies: string[];
  whitelistedCompanies: string[];
}

/**
 * PlacementDrive Document Interface
 */
export interface IPlacementDrive extends Document {
  name: string;
  academicYear: string;
  collegeId: Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  status: DriveStatus;
  driveType: DriveType;
  policies: IPolicy;
  targets: ITargets;
  statistics: IStatistics;
  coordinators: ICoordinator[];
  announcements: IAnnouncement[];
  companyRestrictions: ICompanyRestrictions;
  importantDates: IImportantDate[];
  description?: string;
  guidelines?: string;
  isFrozen: boolean;
  freezeReason?: string;
  freezeDate?: Date;
  unfreezedDate?: Date;
  freezeNotes?: string;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PlacementDrive Schema Definition
 */
const placementDriveSchema = new Schema<IPlacementDrive>(
  {
    name: {
      type: String,
      required: [true, 'Drive name is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College reference is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    registrationStartDate: { type: Date, default: null },
    registrationEndDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
    },
    driveType: {
      type: String,
      enum: [
        'main_placement',
        'summer_internship',
        'winter_internship',
        'pool_campus',
        'off_campus',
      ],
      default: 'main_placement',
    },
    policies: {
      oneOfferRule: {
        enabled: { type: Boolean, default: true },
        description: {
          type: String,
          default: 'Students can accept only one offer',
        },
      },
      dreamCompanyRule: {
        enabled: { type: Boolean, default: true },
        allowMultipleApplications: { type: Boolean, default: false },
        description: { type: String },
      },
      maxApplicationsPerStudent: { type: Number, min: 0, default: 0 },
      postPlacementRules: {
        canApplyAfterPlacement: { type: Boolean, default: false },
        onlyHigherCTC: { type: Boolean, default: true },
        minCTCDifference: { type: Number, default: 0 },
      },
      globalCriteria: {
        minCGPA: { type: Number, default: 0 },
        maxBacklogs: { type: Number, default: 0 },
      },
    },
    targets: {
      targetPlacementPercentage: { type: Number, min: 0, max: 100, default: 0 },
      targetCompaniesCount: { type: Number, min: 0, default: 0 },
      totalStudentsEligible: { type: Number, min: 0, default: 0 },
    },
    statistics: {
      totalJobsPosted: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      totalStudentsPlaced: { type: Number, default: 0 },
      totalOffersRolledOut: { type: Number, default: 0 },
      averageCTC: { type: Number, default: 0 },
      highestCTC: { type: Number, default: 0 },
      lowestCTC: { type: Number, default: 0 },
      placementPercentage: { type: Number, default: 0 },
    },
    coordinators: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['primary', 'secondary', 'department'] },
        department: { type: String },
      },
    ],
    announcements: [
      {
        title: { type: String, required: true },
        message: { type: String, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        priority: {
          type: String,
          enum: ['low', 'normal', 'high', 'urgent'],
          default: 'normal',
        },
        targetAudience: {
          type: String,
          enum: ['all', 'placed', 'not_placed', 'specific_branch'],
          default: 'all',
        },
      },
    ],
    companyRestrictions: {
      blacklistedCompanies: { type: [String], default: [] },
      whitelistedCompanies: { type: [String], default: [] },
    },
    importantDates: [
      {
        event: { type: String, required: true },
        date: { type: Date, required: true },
        description: { type: String },
      },
    ],
    description: { type: String, default: null },
    guidelines: { type: String, default: null },
    isFrozen: { type: Boolean, default: false },
    freezeReason: { type: String, default: null },
    freezeDate: { type: Date, default: null },
    unfreezedDate: { type: Date, default: null },
    freezeNotes: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

placementDriveSchema.index({ collegeId: 1, status: 1 });
placementDriveSchema.index({ collegeId: 1, driveType: 1 });
placementDriveSchema.index({ startDate: 1, endDate: 1 });

export default model<IPlacementDrive>('PlacementDrive', placementDriveSchema);
