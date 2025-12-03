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

/**
 * Nested Interfaces
 */
export interface IEducation {
  tenth?: {
    board?: string;
    schoolName?: string;
    percentage?: number;
    cgpa?: number;
    yearOfPassing?: number;
    marksObtained?: number;
    totalMarks?: number;
    rollNumber?: string;
  };
  twelfth?: {
    board?: string;
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
  company?: string;
  ctc?: number;
  offerDate?: Date;
  status?: OfferStatus;
  jobId?: Schema.Types.ObjectId;
}

/**
 * StudentData Document Interface
 */
export interface IStudentData extends Document {
  userId: Schema.Types.ObjectId;
  collegeId: Schema.Types.ObjectId;
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
  extracurricular: IExtracurricular[];
  publications: IPublication[];
  socialProfiles: ISocialProfiles;
  codingStats: ICodingStats;
  internships: IInternship[];
  workExperience: IWorkExperience[];
  resumeUrl?: string;
  resumeFileName?: string;
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
  academicInfoCompleted: boolean;
  academicInfoCompletedDate?: Date;
  placementPreferences: IPlacementPreferences;
  documentsVerified: boolean;
  verifiedBy?: Schema.Types.ObjectId;
  verificationDate?: Date;
  verificationNotes?: string;
  placementStatus: PlacementStatus;
  eligibilityStatus: IEligibilityStatus;
  placedCompany?: string;
  placementDate?: Date;
  placementType?: PlacementType;
  offerDetails: IOfferDetails;
  allOffers: IOffer[];
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
    cgpa: {
      type: Number,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
      default: null,
    },
    education: {
      tenth: {
        board: { type: String, trim: true },
        schoolName: { type: String, trim: true },
        percentage: { type: Number, min: 0, max: 100 },
        cgpa: { type: Number, min: 0, max: 10 },
        yearOfPassing: { type: Number },
        marksObtained: { type: Number },
        totalMarks: { type: Number },
        rollNumber: { type: String, trim: true },
      },
      twelfth: {
        board: { type: String, trim: true },
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
          name: { type: String, required: true },
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
          name: { type: String, required: true },
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
          name: { type: String, required: true },
          proficiency: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
          },
        },
      ],
      databases: [
        {
          name: { type: String, required: true },
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
    isProfileCompleted: { type: Boolean, default: false },
    profileCompletionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    mandatoryFieldsCompleted: { type: Boolean, default: false },
    personalInfoCompleted: { type: Boolean, default: false },
    personalInfoCompletedDate: { type: Date, default: null },
    academicInfoCompleted: { type: Boolean, default: false },
    academicInfoCompletedDate: { type: Date, default: null },
    placementPreferences: {
      preferredLocations: { type: [String], default: [] },
      preferredCompanyTypes: { type: [String], default: [] },
      preferredRoles: { type: [String], default: [] },
      expectedCTC: { type: Number },
      willingToRelocate: { type: Boolean, default: true },
      noticeRequired: { type: String },
    },
    documentsVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verificationDate: { type: Date, default: null },
    verificationNotes: { type: String, default: null },
    placementStatus: {
      type: String,
      enum: ['eligible', 'not_eligible', 'not_placed', 'placed', 'opted_out', 'barred'],
      default: 'not_eligible',
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
        company: { type: String },
        ctc: { type: Number },
        offerDate: { type: Date },
        status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'] },
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
studentDataSchema.index({ collegeId: 1 });
studentDataSchema.index({ collegeId: 1, documentsVerified: 1 });
studentDataSchema.index({ collegeId: 1, placementStatus: 1 });

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
    basicInfo: 15,
    education: 20,
    academics: 10,
    skills: 15,
    projects: 15,
    experience: 10,
    certifications: 5,
    achievements: 5,
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

  // Resume (5%)
  if (this.resumeUrl) score += weights.resume;

  return Math.min(score, 100);
};

export default model<IStudentData>('StudentData', studentDataSchema);
