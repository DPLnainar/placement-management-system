import { Document, Schema, model } from 'mongoose';

/**
 * Type Definitions for StudentData
 */
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LanguageProficiency = 'basic' | 'conversational' | 'professional' | 'native';
export type Stream = 'science' | 'commerce' | 'arts' | 'diploma' | 'other';
export type WorkMode = 'onsite' | 'remote' | 'hybrid';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'freelance';
export type ProjectCategory = 'personal' | 'academic' | 'freelance' | 'open-source' | 'hackathon' | 'other';
export type AchievementLevel = 'school' | 'college' | 'university' | 'state' | 'national' | 'international';
export type AchievementCategory = 'academic' | 'sports' | 'cultural' | 'technical' | 'hackathon' | 'competition' | 'research' | 'other';
export type PublicationType = 'journal' | 'conference' | 'workshop' | 'arxiv' | 'blog' | 'other';
export type PlacementStatus = 'eligible' | 'not_eligible' | 'not_placed' | 'placed' | 'opted_out' | 'barred';
export type PlacementType = 'dream' | 'super_dream' | 'normal' | 'internship' | 'ppo';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type Category = 'general' | 'obc' | 'sc' | 'st' | 'other';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/**
 * Personal Information Interface
 */
export interface IPersonalInfo {
  // Basic Information
  name?: string;
  email?: string;
  domainId?: string;
  phone?: string;
  dob?: Date;

  // NEW: Identity Fields
  rollNumber?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // NEW: Academic Fields
  course?: 'BE' | 'B.TECH' | 'ME' | 'MBA' | 'MCA' | 'OTHER';
  courseOther?: string;
  branch?: string;
  passedOutYear?: number;
  careerPath?: string;
  disabilityStatus?: 'none' | 'differently_abled' | 'physically_challenged';

  // NEW: Contact Information
  communicationEmail?: string;
  instituteEmail?: string;
  personalEmail?: string;
  alternateEmail?: string;
  whatsappNumber?: string;
  linkedInUrl?: string;
  nationality?: string;

  // Existing Fields
  fatherName?: string;
  motherName?: string;
  aadhaar?: string;
  passportNo?: string;
  address?: string;
  permanentAddress?: string;
  photoUrl?: string;

  // NEW: Family Details (Extended)
  fatherPhone?: string;
  fatherOccupation?: string;
  motherPhone?: string;
  motherOccupation?: string;
}

/**
 * Nested Interfaces
 */
export interface IEducation {
  tenth?: {
    board?: 'CBSE' | 'ICSE' | 'STATE' | 'OTHER';
    boardOther?: string;
    schoolName?: string;
    percentage?: number;
    cgpa?: number;
    yearOfPassing?: number;
    marksObtained?: number;
    totalMarks?: number;
    rollNumber?: string;
  };
  twelfth?: {
    board?: 'CBSE' | 'ICSE' | 'STATE' | 'OTHER';
    boardOther?: string;
    schoolName?: string;
    percentage?: number;
    cgpa?: number;
    yearOfPassing?: number;
    stream?: Stream;
    marksObtained?: number;
    totalMarks?: number;
    rollNumber?: string;
  };
  graduation?: {
    institutionName?: string;
    course?: 'BE' | 'B.TECH' | 'MBA' | 'ME' | 'OTHER';
    courseOther?: string;
    stream?: string;
    streamOther?: string;
    dept?: string;
    degree?: string;
    branch?: string;
    specialization?: string;
    university?: string;
    startYear?: number;
    endYear?: number;
    currentYear?: number;
    currentSemester?: number;
    cgpa?: number;
    percentage?: number;
    rollNumber?: string;
    registrationNumber?: string;
    isCompleted?: boolean;
    arrearsHistory?: boolean;
  };
  postGraduation?: {
    institutionName?: string;
    degree?: string;
    specialization?: string;
    university?: string;
    startYear?: number;
    endYear?: number;
    cgpa?: number;
    percentage?: number;
    isCompleted?: boolean;
  };
}

export interface ISemesterRecord {
  semester?: number;
  sgpa?: number;
  backlogs?: number;
  year?: number;
  subject?: string;
  resolved?: boolean;
}

export interface IResume {
  resumeUrl?: string;
  resumeGeneratedUrl?: string;
  resumeGeneratedAt?: Date;
}

export interface IPlacement {
  placed: boolean;
  companyName?: string;
  jobId?: Schema.Types.ObjectId;
  placedAt?: Date;
}

export interface ISkillItem {
  name: string;
  proficiency?: ProficiencyLevel;
  yearsOfExperience?: number;
  category?: string;
}

export interface ISoftSkill {
  name: string;
  description?: string;
}

export interface ILanguage {
  name: string;
  proficiency?: LanguageProficiency;
  canRead?: boolean;
  canWrite?: boolean;
  canSpeak?: boolean;
}

export interface ICertification {
  name: string;
  issuedBy?: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  certificateUrl?: string;
  verified?: boolean;
  skills?: string[];
  description?: string;
}

export interface IProject {
  title: string;
  description?: string;
  technologies?: string[];
  role?: string;
  teamSize?: number;
  duration?: string;
  startDate?: Date;
  endDate?: Date;
  isOngoing?: boolean;
  projectUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  demoUrl?: string;
  category?: ProjectCategory;
  highlights?: string[];
}

export interface IAchievement {
  title: string;
  description?: string;
  date?: Date;
  category?: AchievementCategory;
  level?: AchievementLevel;
  position?: string;
  organizer?: string;
  certificateUrl?: string;
}

export interface IPatent {
  title: string;
  year: number;
  patentNumber: string;
  description?: string;
  status?: 'filed' | 'granted' | 'pending';
}

export interface ITestScore {
  examName: string;
  score: string | number;
  year: number;
}

export interface IExtracurricular {
  activity: string;
  role?: string;
  organization?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isOngoing?: boolean;
  achievements?: string[];
}

export interface IPublication {
  title: string;
  authors?: string[];
  publicationType?: PublicationType;
  publishedIn?: string;
  publishDate?: Date;
  doi?: string;
  url?: string;
  citations?: number;
  description?: string;
}

export interface ISocialProfiles {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  leetcode?: string;
  hackerrank?: string;
  codeforces?: string;
  codechef?: string;
  twitter?: string;
  medium?: string;
  stackoverflow?: string;
  behance?: string;
  dribbble?: string;
}

export interface ICodingStats {
  leetcodeRating?: number;
  leetcodeSolved?: number;
  codeforcesRating?: number;
  codechefRating?: number;
  hackerrankStars?: number;
  githubStars?: number;
  githubRepos?: number;
}

export interface IInternship {
  company: string;
  role?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isOngoing?: boolean;
  stipend?: string;
  location?: string;
  workMode?: WorkMode;
  technologies?: string[];
  responsibilities?: string[];
  achievements?: string[];
  certificateUrl?: string;
  referenceContact?: {
    name?: string;
    designation?: string;
    email?: string;
    phone?: string;
  };
  performanceRating?: number;
  isPPOOffered?: boolean;
}

export interface IWorkExperience {
  company: string;
  designation: string;
  department?: string;
  employmentType?: EmploymentType;
  startDate?: Date;
  endDate?: Date;
  isCurrentlyWorking?: boolean;
  location?: string;
  workMode?: WorkMode;
  responsibilities?: string[];
  achievements?: string[];
  technologies?: string[];
  salary?: string;
  reasonForLeaving?: string;
  referenceContact?: {
    name?: string;
    designation?: string;
    email?: string;
    phone?: string;
  };
}

export interface IPlacementPreferences {
  preferredLocations?: string[];
  preferredCompanyTypes?: string[];
  preferredRoles?: string[];
  expectedCTC?: number;
  willingToRelocate?: boolean;
  noticeRequired?: string;
}

export interface IEligibilityStatus {
  isEligible: boolean;
  eligibilityReasons: string[];
  eligibilityCheckedBy?: Schema.Types.ObjectId;
  eligibilityCheckedDate?: Date;
}

export interface IOfferDetails {
  ctc?: number;
  baseSalary?: number;
  joiningBonus?: number;
  location?: string;
  joiningDate?: Date;
  offerLetterUrl?: string;
  offerAccepted?: boolean;
  acceptanceDate?: Date;
}

export interface IOffer {
  jobId?: Schema.Types.ObjectId;
  companyName?: string;
  package?: number;
  offerDate?: Date;
  offerLetterUrl?: string;
  status?: OfferStatus;
}

/**
 * StudentData Document Interface
 * Represents comprehensive student profile including academic, personal, and placement data
 */
export interface IStudentData extends Document {
  userId: Schema.Types.ObjectId;
  collegeId: Schema.Types.ObjectId;
  /** Personal information */
  personal: IPersonalInfo;
  cgpa?: number;
  education: IEducation;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  semesterRecords: ISemesterRecord[];
  totalBacklogs: number;
  currentBacklogs: number;
  currentArrears?: string;
  arrearHistory?: string;
  gapYears: number;
  gapYearDetails?: string;
  skills: string[];
  technicalSkills: {
    programming: ISkillItem[];
    frameworks: ISkillItem[];
    tools: ISkillItem[];
    databases: ISkillItem[];
    cloud: ISkillItem[];
    other: ISkillItem[];
  };
  softSkills: ISoftSkill[];
  languages: ILanguage[];
  certifications: ICertification[];
  projects: IProject[];
  achievements: IAchievement[];
  patents: IPatent[];
  testScores: ITestScore[];
  extracurricular: IExtracurricular[];
  publications: IPublication[];
  socialProfiles: ISocialProfiles;
  codingStats: ICodingStats;
  internships: IInternship[];
  workExperience: IWorkExperience[];
  companiesPlacedCount: number;  // Auto-updated from Application records
  resumeUrl?: string;
  resumeFileName?: string;
  /** Whether resume was auto-generated by system */
  resumeGenerated: boolean;
  resumeLink?: string;
  branch?: string;
  yearOfStudy?: number;
  rollNumber?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  parentPhoneNumber?: string;
  currentAddress?: string;
  permanentAddress?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  category?: Category;
  isProfileCompleted: boolean;
  profileCompletionPercentage: number;
  mandatoryFieldsCompleted: boolean;
  personalInfoCompleted: boolean;
  personalInfoCompletedDate?: Date;
  personalInfoLocked: boolean;
  personalInfoLockedBy?: Schema.Types.ObjectId;
  personalInfoLockedDate?: Date;
  academicInfoCompleted: boolean;
  academicInfoCompletedDate?: Date;
  academicInfoLocked: boolean;
  academicInfoLockedBy?: Schema.Types.ObjectId;
  academicInfoLockedDate?: Date;
  placementPreferences: IPlacementPreferences;
  documentsVerified: boolean;
  verifiedBy?: Schema.Types.ObjectId;
  verificationDate?: Date;
  verificationNotes?: string;
  verificationStatus: VerificationStatus;
  verificationRejectionReason?: string;
  lastVerificationRequest?: Date;
  verificationTriggers?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    triggeredAt: Date;
  }>;
  semester?: number;
  placementStatus: PlacementStatus;
  eligibilityStatus: IEligibilityStatus;
  resume: IResume;
  placement: IPlacement;
  placedCompany?: string;
  placementDate?: Date;
  placementType?: PlacementType;
  offerDetails: IOfferDetails;
  allOffers: IOffer[];
  /** Soft delete flag */
  isDeleted: boolean;
  /** User who deleted this profile */
  deletedBy?: Schema.Types.ObjectId;
  /** When the profile was deleted */
  deletedAt?: Date;
  /** Reason for deleting the profile */
  deleteReason?: string;
  createdAt: Date;
  updatedAt: Date;

  calculateProfileCompletion(): number;
}

/**
 * StudentData Schema Definition
 */
const studentDataSchema = new Schema<IStudentData>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College reference is required'],
    },
    personal: {
      // Basic Information
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      domainId: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      dob: { type: Date },

      // NEW: Identity Fields
      rollNumber: {
        type: String,
        trim: true,
        sparse: true,
        index: true
      },
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say']
      },

      // NEW: Academic Fields
      course: {
        type: String,
        enum: ['BE', 'B.TECH', 'ME', 'MBA', 'MCA', 'OTHER']
      },
      courseOther: { type: String, trim: true },
      branch: { type: String, trim: true },
      passedOutYear: {
        type: Number,
        min: [2000, 'Year must be after 2000'],
        max: [2100, 'Year must be before 2100']
      },
      careerPath: { type: String, trim: true },
      disabilityStatus: {
        type: String,
        enum: ['none', 'differently_abled', 'physically_challenged'],
        default: 'none'
      },

      // NEW: Contact Information
      communicationEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
      },
      instituteEmail: {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
      },
      personalEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
      },
      alternateEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
      },
      whatsappNumber: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-]{10,}$/, 'Invalid phone number format']
      },
      linkedInUrl: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'LinkedIn URL must start with http:// or https://']
      },
      nationality: { type: String, trim: true, default: 'Indian' },

      // Existing Fields
      fatherName: { type: String, trim: true, default: '' },
      motherName: { type: String, trim: true, default: '' },
      aadhaar: {
        type: String,
        trim: true,
        match: [/^[0-9]{12}$/, 'Aadhaar must be 12 digits'],
        default: '',
      },
      passportNo: { type: String, trim: true, default: '' },
      address: { type: String, trim: true, default: '' },
      permanentAddress: { type: String, trim: true, default: '' },
      photoUrl: { type: String, trim: true, default: '' },

      // NEW: Extended Family Details
      fatherPhone: { type: String, trim: true },
      fatherOccupation: { type: String, trim: true },
      motherPhone: { type: String, trim: true },
      motherOccupation: { type: String, trim: true },
    },
    cgpa: {
      type: Number,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
      default: null,
    },
    education: {
      tenth: {
        board: { type: String, enum: ['CBSE', 'ICSE', 'STATE', 'OTHER'], default: 'STATE' },
        boardOther: { type: String, trim: true },
        schoolName: { type: String, trim: true },
        percentage: { type: Number, min: 0, max: 100 },
        cgpa: { type: Number, min: 0, max: 10 },
        yearOfPassing: { type: Number },
        marksObtained: { type: Number },
        totalMarks: { type: Number },
        rollNumber: { type: String, trim: true },
      },
      twelfth: {
        board: { type: String, enum: ['CBSE', 'ICSE', 'STATE', 'OTHER'], default: 'STATE' },
        boardOther: { type: String, trim: true },
        schoolName: { type: String, trim: true },
        percentage: { type: Number, min: 0, max: 100 },
        cgpa: { type: Number, min: 0, max: 10 },
        yearOfPassing: { type: Number },
        stream: {
          type: String,
          enum: ['science', 'commerce', 'arts', 'diploma', 'other'],
          default: 'science',
        },
        marksObtained: { type: Number },
        totalMarks: { type: Number },
        rollNumber: { type: String, trim: true },
      },
      graduation: {
        institutionName: { type: String, trim: true },
        course: { type: String, enum: ['BE', 'B.TECH', 'MBA', 'ME', 'OTHER'], default: 'BE' },
        courseOther: { type: String, trim: true },
        stream: { type: String, trim: true },
        streamOther: { type: String, trim: true },
        dept: { type: String, trim: true },
        degree: { type: String, trim: true },
        branch: { type: String, trim: true },
        specialization: { type: String, trim: true },
        university: { type: String, trim: true },
        startYear: { type: Number },
        endYear: { type: Number },
        currentYear: { type: Number, min: 1, max: 5 },
        currentSemester: { type: Number, min: 1, max: 10 },
        cgpa: { type: Number, min: 0, max: 10 },
        percentage: { type: Number, min: 0, max: 100 },
        rollNumber: { type: String, trim: true },
        registrationNumber: { type: String, trim: true },
        isCompleted: { type: Boolean, default: false },
        arrearsHistory: { type: Boolean, default: false },
      },
      postGraduation: {
        institutionName: { type: String, trim: true },
        degree: { type: String, trim: true },
        specialization: { type: String, trim: true },
        university: { type: String, trim: true },
        startYear: { type: Number },
        endYear: { type: Number },
        cgpa: { type: Number, min: 0, max: 10 },
        percentage: { type: Number, min: 0, max: 100 },
        isCompleted: { type: Boolean, default: false },
      },
    },
    tenthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: null,
    },
    twelfthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
      default: null,
    },
    semesterRecords: [
      {
        semester: { type: Number, min: 1, max: 10 },
        sgpa: { type: Number, min: 0, max: 10 },
        backlogs: { type: Number, min: 0, default: 0 },
        year: { type: Number },
        subject: { type: String, trim: true },
        resolved: { type: Boolean, default: false },
      },
    ],
    totalBacklogs: { type: Number, min: 0, default: 0 },
    currentBacklogs: { type: Number, min: 0, default: 0 },
    currentArrears: { type: String, trim: true, default: null },
    arrearHistory: { type: String, trim: true, default: null },
    gapYears: { type: Number, min: 0, default: 0 },
    gapYearDetails: { type: String, default: null },
    skills: { type: [String], default: [] },
    technicalSkills: {
      programming: [
        {
          name: { type: String, required: false },
          proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
          },
          yearsOfExperience: { type: Number, min: 0, max: 50 },
        },
      ],
      frameworks: [
        {
          name: { type: String, required: false },
          proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
          },
          yearsOfExperience: { type: Number, min: 0, max: 50 },
        },
      ],
      tools: [
        {
          name: { type: String, required: false },
          proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
          },
        },
      ],
      databases: [
        {
          name: { type: String, required: false },
          proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
          },
        },
      ],
      cloud: [
        {
          name: { type: String, required: true },
          proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
          },
        },
      ],
      other: [
        {
          name: { type: String, required: true },
          category: { type: String },
          proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
          },
        },
      ],
    },
    softSkills: [
      {
        name: { type: String, required: true },
        description: { type: String },
      },
    ],
    languages: [
      {
        name: { type: String, required: true },
        proficiency: {
          type: String,
          enum: ['basic', 'conversational', 'professional', 'native'],
          default: 'conversational',
        },
        canRead: { type: Boolean, default: true },
        canWrite: { type: Boolean, default: true },
        canSpeak: { type: Boolean, default: true },
      },
    ],
    certifications: [
      {
        name: { type: String, required: true },
        issuedBy: { type: String },
        issueDate: { type: Date },
        expiryDate: { type: Date },
        credentialId: { type: String },
        credentialUrl: { type: String },
        certificateUrl: { type: String },
        verified: { type: Boolean, default: false },
        skills: { type: [String], default: [] },
        description: { type: String },
      },
    ],
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String },
        technologies: { type: [String], default: [] },
        role: { type: String },
        teamSize: { type: Number, min: 1 },
        duration: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isOngoing: { type: Boolean, default: false },
        projectUrl: { type: String },
        githubUrl: { type: String },
        liveUrl: { type: String },
        demoUrl: { type: String },
        category: {
          type: String,
          enum: ['personal', 'academic', 'freelance', 'open-source', 'hackathon', 'other'],
          default: 'personal',
        },
        highlights: { type: [String], default: [] },
      },
    ],
    achievements: [
      {
        title: { type: String, required: true },
        description: { type: String },
        date: { type: Date },
        category: {
          type: String,
          enum: [
            'academic',
            'sports',
            'cultural',
            'technical',
            'hackathon',
            'competition',
            'research',
            'other',
          ],
          default: 'other',
        },
        level: {
          type: String,
          enum: ['school', 'college', 'university', 'state', 'national', 'international'],
          default: 'college',
        },
        position: { type: String },
        organizer: { type: String },
        certificateUrl: { type: String },
      },
    ],
    extracurricular: [
      {
        activity: { type: String, required: true },
        role: { type: String },
        organization: { type: String },
        description: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isOngoing: { type: Boolean, default: false },
        achievements: { type: [String], default: [] },
      },
    ],
    publications: [
      {
        title: { type: String, required: true },
        authors: { type: [String], default: [] },
        publicationType: {
          type: String,
          enum: ['journal', 'conference', 'workshop', 'arxiv', 'blog', 'other'],
          default: 'journal',
        },
        publishedIn: { type: String },
        publishDate: { type: Date },
        doi: { type: String },
        url: { type: String },
        citations: { type: Number, min: 0, default: 0 },
        description: { type: String },
      },
    ],
    socialProfiles: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      portfolio: { type: String, trim: true },
      leetcode: { type: String, trim: true },
      hackerrank: { type: String, trim: true },
      codeforces: { type: String, trim: true },
      codechef: { type: String, trim: true },
      twitter: { type: String, trim: true },
      medium: { type: String, trim: true },
      stackoverflow: { type: String, trim: true },
      behance: { type: String, trim: true },
      dribbble: { type: String, trim: true },
    },
    codingStats: {
      leetcodeRating: { type: Number },
      leetcodeSolved: { type: Number },
      codeforcesRating: { type: Number },
      codechefRating: { type: Number },
      hackerrankStars: { type: Number, min: 0, max: 7 },
      githubStars: { type: Number },
      githubRepos: { type: Number },
    },
    internships: [
      {
        company: { type: String, required: true },
        role: { type: String },
        description: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isOngoing: { type: Boolean, default: false },
        stipend: { type: String },
        location: { type: String },
        workMode: { type: String, enum: ['onsite', 'remote', 'hybrid'], default: 'onsite' },
        technologies: { type: [String], default: [] },
        responsibilities: { type: [String], default: [] },
        achievements: { type: [String], default: [] },
        certificateUrl: { type: String },
        referenceContact: {
          name: { type: String },
          designation: { type: String },
          email: { type: String },
          phone: { type: String },
        },
        performanceRating: { type: Number, min: 0, max: 5 },
        isPPOOffered: { type: Boolean, default: false },
      },
    ],
    workExperience: [
      {
        company: { type: String, required: true },
        designation: { type: String, required: true },
        department: { type: String },
        employmentType: {
          type: String,
          enum: ['full-time', 'part-time', 'contract', 'freelance'],
          default: 'full-time',
        },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrentlyWorking: { type: Boolean, default: false },
        location: { type: String },
        workMode: { type: String, enum: ['onsite', 'remote', 'hybrid'], default: 'onsite' },
        responsibilities: { type: [String], default: [] },
        achievements: { type: [String], default: [] },
        technologies: { type: [String], default: [] },
        salary: { type: String },
        reasonForLeaving: { type: String },
        referenceContact: {
          name: { type: String },
          designation: { type: String },
          email: { type: String },
          phone: { type: String },
        },
      },
    ],
    resumeUrl: { type: String, default: null },
    resumeFileName: { type: String, default: null },
    resumeGenerated: { type: Boolean, default: false },
    resumeLink: { type: String, trim: true, default: null },
    branch: { type: String, trim: true, default: null },
    yearOfStudy: { type: Number, min: 1, max: 4, default: null },
    rollNumber: { type: String, trim: true, default: null },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
      default: null,
    },
    alternatePhoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
      default: null,
    },
    parentPhoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
      default: null,
    },
    currentAddress: { type: String, default: null },
    permanentAddress: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: null,
    },
    category: {
      type: String,
      enum: ['general', 'obc', 'sc', 'st', 'other'],
      default: null,
    },

    placementPreferences: {
      preferredLocations: { type: [String], default: [] },
      preferredCompanyTypes: { type: [String], default: [] },
      preferredRoles: { type: [String], default: [] },
      expectedCTC: { type: Number },
      willingToRelocate: { type: Boolean, default: true },
      noticeRequired: { type: String },
    },

    placementStatus: {
      type: String,
      enum: ['eligible', 'not_eligible', 'not_placed', 'placed', 'opted_out', 'barred'],
      default: 'not_eligible',
    },
    resume: {
      resumeUrl: { type: String, default: null },
      resumeGeneratedUrl: { type: String, default: null },
      resumeGeneratedAt: { type: Date, default: null },
    },
    placement: {
      placed: { type: Boolean, default: false },
      companyName: { type: String, default: null },
      jobId: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
      placedAt: { type: Date, default: null },
    },
    eligibilityStatus: {
      isEligible: { type: Boolean, default: false },
      eligibilityReasons: { type: [String], default: [] },
      eligibilityCheckedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      eligibilityCheckedDate: { type: Date },
    },
    placedCompany: { type: String, default: null },
    placementDate: { type: Date, default: null },
    placementType: {
      type: String,
      enum: ['dream', 'super_dream', 'normal', 'internship', 'ppo'],
      default: null,
    },
    offerDetails: {
      ctc: { type: Number },
      baseSalary: { type: Number },
      joiningBonus: { type: Number },
      location: { type: String },
      joiningDate: { type: Date },
      offerLetterUrl: { type: String },
      offerAccepted: { type: Boolean, default: false },
      acceptanceDate: { type: Date },
    },
    allOffers: [
      {
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        companyName: { type: String },
        package: { type: Number },
        offerDate: { type: Date, default: Date.now },
        offerLetterUrl: { type: String },
        status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
      },
    ],
    // NEW: Test Scores
    testScores: [
      {
        examName: { type: String, required: true },
        score: { type: Schema.Types.Mixed, required: true },
        year: {
          type: Number,
          required: true,
          min: [2000, 'Year must be 2000 or later'],
          max: [new Date().getFullYear() + 5, 'Year cannot be more than 5 years in the future']
        },
      },
    ],
    // NEW: Patents
    patents: [
      {
        title: { type: String, required: true },
        year: { type: Number, required: true },
        patentNumber: { type: String, required: true },
        description: { type: String },
        status: {
          type: String,
          enum: ['filed', 'granted', 'pending'],
          default: 'pending'
        },
      },
    ],
    // NEW: Companies Placed Count (auto-updated from applications)
    companiesPlacedCount: { type: Number, default: 0 },

    // Profile Completion and Lock Status
    isProfileCompleted: { type: Boolean, default: false },
    profileCompletionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    mandatoryFieldsCompleted: { type: Boolean, default: false },

    personalInfoCompleted: { type: Boolean, default: false },
    personalInfoCompletedDate: { type: Date },
    personalInfoLocked: { type: Boolean, default: false },
    personalInfoLockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    personalInfoLockedDate: { type: Date },

    academicInfoCompleted: { type: Boolean, default: false },
    academicInfoCompletedDate: { type: Date },
    academicInfoLocked: { type: Boolean, default: false },
    academicInfoLockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    academicInfoLockedDate: { type: Date },

    // Document Verification
    documentsVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationDate: { type: Date },
    verificationNotes: { type: String },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    verificationRejectionReason: { type: String },
    lastVerificationRequest: { type: Date },
    verificationTriggers: [{
      field: { type: String },
      oldValue: { type: Schema.Types.Mixed },
      newValue: { type: Schema.Types.Mixed },
      triggeredAt: { type: Date, default: Date.now }
    }],
    semester: { type: Number, min: 1, max: 12 },

    // Soft Delete Fields
    isDeleted: { type: Boolean, default: false },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
    deletedAt: { type: Date, default: undefined },
    deleteReason: { type: String, trim: true, default: undefined },
  },
  {
    timestamps: true,
  }
);

// Indexes
studentDataSchema.index({ collegeId: 1 });
studentDataSchema.index({ collegeId: 1, documentsVerified: 1 });
studentDataSchema.index({ collegeId: 1, placementStatus: 1 });
// NEW: Indexes for new fields


// Virtual field for fullName
studentDataSchema.virtual('personal.fullName').get(function () {
  const firstName = this.personal?.firstName || '';
  const lastName = this.personal?.lastName || '';
  return `${firstName} ${lastName}`.trim() || this.personal?.name || '';
});

// Ensure virtuals are included in JSON
studentDataSchema.set('toJSON', { virtuals: true });
studentDataSchema.set('toObject', { virtuals: true });

// Pre-save middleware
studentDataSchema.pre('save', function (_next) {
  this.updatedAt = new Date();
  this.profileCompletionPercentage = this.calculateProfileCompletion();
  _next();
});

/**
 * Calculate profile completion percentage
 */
studentDataSchema.methods.calculateProfileCompletion = function (): number {
  let score = 0;
  const weights = {
    basicInfo: 14,
    education: 18,
    academics: 10,
    skills: 14,
    projects: 14,
    experience: 10,
    certifications: 5,
    achievements: 5,
    testScores: 3,
    patents: 2,
    resume: 5,
  };

  // Basic Info (15%)
  if (
    this.phoneNumber &&
    this.dateOfBirth &&
    this.gender &&
    this.currentAddress
  ) {
    score += weights.basicInfo;
  } else if (this.phoneNumber || this.dateOfBirth) {
    score += weights.basicInfo * 0.5;
  }

  // Education (20%)
  const hasEducation =
    this.education?.tenth?.percentage &&
    this.education?.twelfth?.percentage &&
    this.education?.graduation?.cgpa;
  if (hasEducation) score += weights.education;

  // Academics (10%)
  if (this.cgpa || this.education?.graduation?.cgpa) score += weights.academics;

  // Skills (15%)
  if (
    this.technicalSkills?.programming?.length ||
    this.technicalSkills?.frameworks?.length ||
    this.softSkills?.length
  ) {
    score += weights.skills;
  }

  // Projects (15%)
  if (this.projects?.length >= 2) score += weights.projects;
  else if (this.projects?.length === 1) score += weights.projects * 0.5;

  // Experience (10%)
  if (this.internships?.length || this.workExperience?.length)
    score += weights.experience;

  // Certifications (5%)
  if (this.certifications?.length) score += weights.certifications;

  // Achievements (5%)
  if (this.achievements?.length) score += weights.achievements;

  // Test Scores (3%)
  if (this.testScores?.length) score += weights.testScores;

  // Patents (2%)
  if (this.patents?.length) score += weights.patents;

  // Resume (5%)
  if (this.resumeUrl) score += weights.resume;

  return Math.min(score, 100);
};

export default model<IStudentData>('StudentData', studentDataSchema);
