import { Document, Schema, model } from 'mongoose';

/**
 * Company Type Definitions
 */
export type Industry =
  | 'IT/Software'
  | 'Consulting'
  | 'Finance/Banking'
  | 'Manufacturing'
  | 'E-commerce'
  | 'Healthcare'
  | 'Education'
  | 'Automotive'
  | 'Telecommunications'
  | 'Retail'
  | 'Other';

export type CompanySize = '1-50' | '51-200' | '201-500' | '501-1000' | '1000+';
export type Tier = 'super_dream' | 'dream' | 'normal';
export type CompanyStatus = 'active' | 'inactive' | 'blacklisted';
export type WorkMode = 'onsite' | 'remote' | 'hybrid';

/**
 * Nested Interfaces
 */
export interface IContactPerson {
  name?: string;
  designation?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
}

export interface IHRContact {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface IHeadquarters {
  city?: string;
  state?: string;
  country?: string;
}

export interface IPortalAccess {
  enabled: boolean;
  username?: string;
  password?: string;
  email?: string;
  lastLogin?: Date;
  isActive: boolean;
}

export interface IPlacementRecord {
  year?: number;
  studentsHired?: number;
  averagePackage?: number;
  highestPackage?: number;
  roles?: string[];
  feedback?: string;
}

export interface IDocument {
  name?: string;
  type?: string;
  url?: string;
  uploadedAt: Date;
}

export interface ISocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
}

export interface IStats {
  totalJobsPosted: number;
  totalStudentsHired: number;
  activeJobs: number;
  lastVisitDate?: Date;
}

export interface IRating {
  overall: number;
  workCulture?: number;
  compensation?: number;
  growthOpportunities?: number;
  reviewCount: number;
}

export interface IReview {
  student?: Schema.Types.ObjectId;
  rating?: number;
  review?: string;
  createdAt: Date;
}

/**
 * Company Document Interface
 */
export interface ICompany extends Document {
  college: Schema.Types.ObjectId;
  name: string;
  displayName?: string;
  logo?: string;
  website?: string;
  industry?: Industry;
  companySize?: CompanySize;
  headquarters: IHeadquarters;
  description?: string;
  contactPerson: IContactPerson;
  hrContacts: IHRContact[];
  address: IAddress;
  portalAccess: IPortalAccess;
  placementHistory: IPlacementRecord[];
  tier: Tier;
  preferredBranches: string[];
  preferredSkills: string[];
  minimumCGPA?: number;
  allowBacklogs: boolean;
  maxBacklogs: number;
  documents: IDocument[];
  socialLinks: ISocialLinks;
  stats: IStats;
  status: CompanyStatus;
  blacklistReason?: string;
  rating: IRating;
  reviews: IReview[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Company Schema Definition
 */
const companySchema = new Schema<ICompany>(
  {
    college: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    displayName: { type: String },
    logo: { type: String },
    website: { type: String },
    industry: {
      type: String,
      enum: [
        'IT/Software',
        'Consulting',
        'Finance/Banking',
        'Manufacturing',
        'E-commerce',
        'Healthcare',
        'Education',
        'Automotive',
        'Telecommunications',
        'Retail',
        'Other',
      ],
    },
    companySize: {
      type: String,
      enum: ['1-50', '51-200', '201-500', '501-1000', '1000+'],
    },
    headquarters: {
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    description: { type: String, maxlength: 2000 },
    contactPerson: {
      name: { type: String },
      designation: { type: String },
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String },
      alternatePhone: { type: String },
    },
    hrContacts: [
      {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        designation: { type: String },
      },
    ],
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String },
    },
    portalAccess: {
      enabled: { type: Boolean, default: false },
      username: { type: String, unique: true, sparse: true },
      password: { type: String, select: false },
      email: { type: String, lowercase: true, trim: true },
      lastLogin: { type: Date },
      isActive: { type: Boolean, default: true },
    },
    placementHistory: [
      {
        year: { type: Number },
        studentsHired: { type: Number },
        averagePackage: { type: Number },
        highestPackage: { type: Number },
        roles: { type: [String] },
        feedback: { type: String },
      },
    ],
    tier: {
      type: String,
      enum: ['super_dream', 'dream', 'normal'],
      default: 'normal',
    },
    preferredBranches: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    minimumCGPA: { type: Number, min: 0, max: 10 },
    allowBacklogs: { type: Boolean, default: true },
    maxBacklogs: { type: Number, default: 0 },
    documents: [
      {
        name: { type: String },
        type: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      instagram: { type: String },
    },
    stats: {
      totalJobsPosted: { type: Number, default: 0 },
      totalStudentsHired: { type: Number, default: 0 },
      activeJobs: { type: Number, default: 0 },
      lastVisitDate: { type: Date },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blacklisted'],
      default: 'active',
      index: true,
    },
    blacklistReason: { type: String },
    rating: {
      overall: { type: Number, min: 0, max: 5, default: 0 },
      workCulture: { type: Number },
      compensation: { type: Number },
      growthOpportunities: { type: Number },
      reviewCount: { type: Number, default: 0 },
    },
    reviews: [
      {
        student: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        review: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default model<ICompany>('Company', companySchema);
