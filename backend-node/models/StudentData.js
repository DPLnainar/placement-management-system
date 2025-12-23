const mongoose = require('mongoose');

/**
 * StudentData Model
 * 
 * Stores additional student-specific information like resume, CGPA, skills
 * Linked to both User (student) and College for data isolation
 */
const studentDataSchema = new mongoose.Schema({
  // Reference to the student user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true  // One student data record per student
  },
  // Duplicate college reference for faster queries and data isolation
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College reference is required']
  },
  // Academic Information
  cgpa: {
    type: Number,
    min: [0, 'CGPA cannot be negative'],
    max: [10, 'CGPA cannot exceed 10'],
    default: null
  },
  // Comprehensive education history
  education: {
    // 10th Standard
    tenth: {
      board: { type: String, trim: true },
      schoolName: { type: String, trim: true },
      percentage: { type: Number, min: 0, max: 100 },
      cgpa: { type: Number, min: 0, max: 10 },
      yearOfPassing: { type: Number },
      marksObtained: { type: Number },
      totalMarks: { type: Number },
      rollNumber: { type: String, trim: true }
    },
    // 12th Standard / Diploma
    twelfth: {
      board: { type: String, trim: true },
      schoolName: { type: String, trim: true },
      percentage: { type: Number, min: 0, max: 100 },
      cgpa: { type: Number, min: 0, max: 10 },
      yearOfPassing: { type: Number },
      stream: { type: String, enum: ['science', 'commerce', 'arts', 'diploma', 'other'], default: 'science' },
      marksObtained: { type: Number },
      totalMarks: { type: Number },
      rollNumber: { type: String, trim: true }
    },
    // Graduation (current/completed)
    graduation: {
      institutionName: { type: String, trim: true },
      degree: { type: String, trim: true }, // B.Tech, B.E., etc.
      branch: { type: String, trim: true }, // CSE, ECE, etc.
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
      isCompleted: { type: Boolean, default: false }
    },
    // Post-graduation (if any)
    postGraduation: {
      institutionName: { type: String, trim: true },
      degree: { type: String, trim: true }, // M.Tech, MBA, etc.
      specialization: { type: String, trim: true },
      university: { type: String, trim: true },
      startYear: { type: Number },
      endYear: { type: Number },
      cgpa: { type: Number, min: 0, max: 10 },
      percentage: { type: Number, min: 0, max: 100 },
      isCompleted: { type: Boolean, default: false }
    }
  },
  // Legacy fields (kept for backward compatibility)
  tenthPercentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100'],
    default: null
  },
  twelfthPercentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100'],
    default: null
  },
  // Semester-wise academic records
  semesterRecords: [{
    semester: { type: Number, min: 1, max: 10 },
    sgpa: { type: Number, min: 0, max: 10 },
    backlogs: { type: Number, min: 0, default: 0 },
    year: { type: Number }
  }],
  totalBacklogs: {
    type: Number,
    min: 0,
    default: 0
  },
  currentBacklogs: {
    type: Number,
    min: 0,
    default: 0
  },
  // Simplified arrear tracking
  currentArrears: {
    type: String,
    default: null,
    trim: true
  },
  arrearHistory: {
    type: String,
    default: null,
    trim: true
  },
  gapYears: {
    type: Number,
    min: 0,
    default: 0
  },
  gapYearDetails: {
    type: String,
    default: null
  },
  // Skills categorization with proficiency levels
  skills: {
    type: [String],
    default: []
  },
  // Detailed technical skills with proficiency
  technicalSkills: {
    programming: [{
      name: { type: String, required: true },
      proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
      yearsOfExperience: { type: Number, min: 0, max: 50 }
    }],
    frameworks: [{
      name: { type: String, required: true },
      proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
      yearsOfExperience: { type: Number, min: 0, max: 50 }
    }],
    tools: [{
      name: { type: String, required: true },
      proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' }
    }],
    databases: [{
      name: { type: String, required: true },
      proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' }
    }],
    cloud: [{
      name: { type: String, required: true },
      proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' }
    }],
    other: [{
      name: { type: String, required: true },
      category: { type: String },
      proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' }
    }]
  },
  softSkills: [{
    name: { type: String, required: true },
    description: { type: String }
  }],
  // Languages
  languages: [{
    name: { type: String, required: true },
    proficiency: { type: String, enum: ['basic', 'conversational', 'professional', 'native'], default: 'conversational' },
    canRead: { type: Boolean, default: true },
    canWrite: { type: Boolean, default: true },
    canSpeak: { type: Boolean, default: true }
  }],
  // Certifications with enhanced tracking
  certifications: [{
    name: { type: String, required: true },
    issuedBy: { type: String },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String },
    credentialUrl: { type: String },
    certificateUrl: { type: String },
    verified: { type: Boolean, default: false },
    skills: { type: [String], default: [] },
    description: { type: String }
  }],
  // Projects with enhanced details
  projects: [{
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
    category: { type: String, enum: ['personal', 'academic', 'freelance', 'open-source', 'hackathon', 'other'], default: 'personal' },
    highlights: { type: [String], default: [] }
  }],
  // Achievements with enhanced details
  achievements: [{
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date },
    category: {
      type: String,
      enum: ['academic', 'sports', 'cultural', 'technical', 'hackathon', 'competition', 'research', 'other'],
      default: 'other'
    },
    level: { type: String, enum: ['school', 'college', 'university', 'state', 'national', 'international'], default: 'college' },
    position: { type: String },
    organizer: { type: String },
    certificateUrl: { type: String }
  }],
  // Extracurricular Activities
  extracurricular: [{
    activity: { type: String, required: true },
    role: { type: String },
    organization: { type: String },
    description: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    isOngoing: { type: Boolean, default: false },
    achievements: { type: [String], default: [] }
  }],
  // Research & Publications
  publications: [{
    title: { type: String, required: true },
    authors: { type: [String], default: [] },
    publicationType: { type: String, enum: ['journal', 'conference', 'workshop', 'arxiv', 'blog', 'other'], default: 'journal' },
    publishedIn: { type: String },
    publishDate: { type: Date },
    doi: { type: String },
    url: { type: String },
    citations: { type: Number, min: 0, default: 0 },
    description: { type: String }
  }],
  // Online Profiles
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
    dribbble: { type: String, trim: true }
  },
  // Coding Profiles Stats
  codingStats: {
    leetcodeRating: { type: Number },
    leetcodeSolved: { type: Number },
    codeforcesRating: { type: Number },
    codechefRating: { type: Number },
    hackerrankStars: { type: Number, min: 0, max: 7 },
    githubStars: { type: Number },
    githubRepos: { type: Number }
  },
  // Internships with comprehensive details
  internships: [{
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
      phone: { type: String }
    },
    performanceRating: { type: Number, min: 0, max: 5 },
    isPPOOffered: { type: Boolean, default: false }
  }],
  // Work Experience (full-time jobs)
  workExperience: [{
    company: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String },
    employmentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'freelance'], default: 'full-time' },
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
      phone: { type: String }
    }
  }],
  // Resume
  resumeUrl: {
    type: String,
    default: null
  },
  resumeFileName: {
    type: String,
    default: null
  },
  // External resume link (e.g., Google Drive)
  resumeLink: {
    type: String,
    trim: true,
    default: null
  },
  // Additional Information
  branch: {
    type: String,
    trim: true,
    default: null
  },
  yearOfStudy: {
    type: Number,
    min: 1,
    max: 4,
    default: null
  },
  rollNumber: {
    type: String,
    trim: true,
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    default: null
  },
  alternatePhoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    default: null
  },
  parentPhoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    default: null
  },
  currentAddress: {
    type: String,
    default: null
  },
  permanentAddress: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: null
  },
  category: {
    type: String,
    enum: ['general', 'obc', 'sc', 'st', 'other'],
    default: null
  },
  // Profile completion
  isProfileCompleted: {
    type: Boolean,
    default: false
  },
  profileCompletionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  mandatoryFieldsCompleted: {
    type: Boolean,
    default: false
  },
  // Personal Information Completion (User profile: name, email, phone, address, DOB, gender)
  personalInfoCompleted: {
    type: Boolean,
    default: false
  },
  personalInfoCompletedDate: {
    type: Date,
    default: null
  },
  // Academic Information Completion (Education: 10th, 12th, graduation CGPA, backlogs)
  academicInfoCompleted: {
    type: Boolean,
    default: false
  },
  academicInfoCompletedDate: {
    type: Date,
    default: null
  },
  // Placement preferences
  placementPreferences: {
    preferredLocations: { type: [String], default: [] },
    preferredCompanyTypes: { type: [String], default: [] },
    preferredRoles: { type: [String], default: [] },
    expectedCTC: { type: Number },
    willingToRelocate: { type: Boolean, default: true },
    noticeRequired: { type: String }
  },
  // Document Verification Status
  documentsVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to moderator who verified
    default: null
  },
  verificationDate: {
    type: Date,
    default: null
  },
  verificationNotes: {
    type: String,
    default: null
  },
  // Placement Status
  placementStatus: {
    type: String,
    enum: ['eligible', 'not_eligible', 'not_placed', 'placed', 'opted_out', 'barred'],
    default: 'not_eligible'
  },
  eligibilityStatus: {
    isEligible: { type: Boolean, default: false },
    eligibilityReasons: { type: [String], default: [] },
    eligibilityCheckedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    eligibilityCheckedDate: { type: Date }
  },
  placedCompany: {
    type: String,
    default: null
  },
  placementDate: {
    type: Date,
    default: null
  },
  placementType: {
    type: String,
    enum: ['dream', 'super_dream', 'normal', 'internship', 'ppo'],
    default: null
  },
  offerDetails: {
    ctc: { type: Number },
    baseSalary: { type: Number },
    joiningBonus: { type: Number },
    location: { type: String },
    joiningDate: { type: Date },
    offerLetterUrl: { type: String },
    offerAccepted: { type: Boolean, default: false },
    acceptanceDate: { type: Date }
  },
  // Multiple offers tracking
  allOffers: [{
    company: { type: String },
    ctc: { type: Number },
    offerDate: { type: Date },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'] },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }
  }],
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
// Note: userId already has unique index from schema definition (line 13)
studentDataSchema.index({ collegeId: 1 });
studentDataSchema.index({ collegeId: 1, documentsVerified: 1 });
studentDataSchema.index({ collegeId: 1, placementStatus: 1 });
studentDataSchema.index({ collegeId: 1, 'education.graduation.branch': 1, cgpa: -1 }); // Optimized for filtering eligible students

// Update the updatedAt timestamp before saving
studentDataSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Auto-calculate profile completion percentage
  this.profileCompletionPercentage = this.calculateProfileCompletion();

  next();
});

// Calculate profile completion percentage
studentDataSchema.methods.calculateProfileCompletion = function () {
  let score = 0;
  const weights = {
    basicInfo: 15,        // phone, dob, gender, address
    education: 20,        // 10th, 12th, graduation details
    academics: 10,        // CGPA, backlogs
    skills: 15,           // technical skills, languages
    projects: 15,         // at least 2 projects
    experience: 10,       // internships or work
    certifications: 5,    // at least 1 certification
    achievements: 5,      // at least 1 achievement
    resume: 5             // resume uploaded
  };

  // Basic Info (15%)
  if (this.phoneNumber && this.dateOfBirth && this.gender && this.currentAddress) {
    score += weights.basicInfo;
  } else if (this.phoneNumber || this.dateOfBirth) {
    score += weights.basicInfo * 0.5;
  }

  // Education (20%)
  const hasEducation = this.education?.tenth?.percentage &&
    this.education?.twelfth?.percentage &&
    this.education?.graduation?.cgpa;
  if (hasEducation) {
    score += weights.education;
  } else if (this.education?.graduation?.cgpa) {
    score += weights.education * 0.5;
  }

  // Academics (10%)
  if (this.cgpa) {
    score += weights.academics;
  }

  // Skills (15%)
  const skillsCount = (this.technicalSkills?.programming?.length || 0) +
    (this.technicalSkills?.frameworks?.length || 0) +
    (this.languages?.length || 0);
  if (skillsCount >= 5) {
    score += weights.skills;
  } else if (skillsCount > 0) {
    score += weights.skills * (skillsCount / 5);
  }

  // Projects (15%)
  const projectsCount = this.projects?.length || 0;
  if (projectsCount >= 2) {
    score += weights.projects;
  } else if (projectsCount === 1) {
    score += weights.projects * 0.5;
  }

  // Experience (10%)
  const experienceCount = (this.internships?.length || 0) + (this.workExperience?.length || 0);
  if (experienceCount > 0) {
    score += weights.experience;
  }

  // Certifications (5%)
  if (this.certifications?.length > 0) {
    score += weights.certifications;
  }

  // Achievements (5%)
  if (this.achievements?.length > 0) {
    score += weights.achievements;
  }

  // Resume (5%)
  if (this.resumeUrl || this.resumeLink) {
    score += weights.resume;
  }

  return Math.round(score);
};

// Get profile strength summary
studentDataSchema.methods.getProfileStrength = function () {
  const completion = this.profileCompletionPercentage || this.calculateProfileCompletion();

  let strength = 'weak';
  let suggestions = [];

  if (completion >= 90) strength = 'excellent';
  else if (completion >= 75) strength = 'strong';
  else if (completion >= 50) strength = 'moderate';

  // Generate suggestions
  if (!this.phoneNumber) suggestions.push('Add phone number');
  if (!this.resumeUrl && !this.resumeLink) suggestions.push('Upload resume');
  if (!this.education?.graduation?.cgpa) suggestions.push('Add graduation details');
  if (!this.technicalSkills?.programming?.length) suggestions.push('Add programming skills');
  if (!this.projects?.length) suggestions.push('Add projects');
  if (!this.internships?.length && !this.workExperience?.length) suggestions.push('Add experience');

  return {
    percentage: completion,
    strength: strength,
    suggestions: suggestions
  };
};

// Get total experience in months
studentDataSchema.methods.getTotalExperience = function () {
  let totalMonths = 0;

  // Calculate internship experience
  if (this.internships) {
    this.internships.forEach(internship => {
      if (internship.startDate) {
        const endDate = internship.isOngoing ? new Date() : (internship.endDate || new Date());
        const months = Math.round((endDate - internship.startDate) / (1000 * 60 * 60 * 24 * 30));
        totalMonths += months;
      }
    });
  }

  // Calculate work experience
  if (this.workExperience) {
    this.workExperience.forEach(work => {
      if (work.startDate) {
        const endDate = work.isCurrentlyWorking ? new Date() : (work.endDate || new Date());
        const months = Math.round((endDate - work.startDate) / (1000 * 60 * 60 * 24 * 30));
        totalMonths += months;
      }
    });
  }

  return totalMonths;
};

// Get all unique technologies/skills
studentDataSchema.methods.getAllSkills = function () {
  const skillsSet = new Set();

  // Technical skills
  this.technicalSkills?.programming?.forEach(s => skillsSet.add(s.name || s));
  this.technicalSkills?.frameworks?.forEach(s => skillsSet.add(s.name || s));
  this.technicalSkills?.tools?.forEach(s => skillsSet.add(s.name || s));
  this.technicalSkills?.databases?.forEach(s => skillsSet.add(s.name || s));
  this.technicalSkills?.cloud?.forEach(s => skillsSet.add(s.name || s));

  // From projects
  this.projects?.forEach(project => {
    project.technologies?.forEach(tech => skillsSet.add(tech));
  });

  // From internships
  this.internships?.forEach(internship => {
    internship.technologies?.forEach(tech => skillsSet.add(tech));
  });

  // From work experience
  this.workExperience?.forEach(work => {
    work.technologies?.forEach(tech => skillsSet.add(tech));
  });

  return Array.from(skillsSet);
};

// Check if personal information is complete
studentDataSchema.methods.isPersonalInfoComplete = function () {
  return !!(
    this.phoneNumber &&
    this.dateOfBirth &&
    this.gender &&
    this.currentAddress &&
    this.permanentAddress
  );
};

// Check if academic information is complete
studentDataSchema.methods.isAcademicInfoComplete = function () {
  const hasEducation = !!(
    this.education?.tenth?.percentage &&
    this.education?.twelfth?.percentage &&
    this.education?.graduation?.cgpa
  );
  
  return !!(hasEducation && (this.cgpa || this.education?.graduation?.cgpa));
};

// Get missing fields for personal info
studentDataSchema.methods.getMissingPersonalInfoFields = function () {
  const missing = [];
  if (!this.phoneNumber) missing.push('Phone Number');
  if (!this.dateOfBirth) missing.push('Date of Birth');
  if (!this.gender) missing.push('Gender');
  if (!this.currentAddress) missing.push('Current Address');
  if (!this.permanentAddress) missing.push('Permanent Address');
  return missing;
};

// Get missing fields for academic info
studentDataSchema.methods.getMissingAcademicInfoFields = function () {
  const missing = [];
  if (!this.education?.tenth?.percentage) missing.push('10th Grade Details');
  if (!this.education?.twelfth?.percentage) missing.push('12th Grade Details');
  if (!this.education?.graduation?.cgpa) missing.push('Graduation CGPA');
  if (!this.cgpa && !this.education?.graduation?.cgpa) missing.push('Current CGPA');
  return missing;
};

module.exports = mongoose.model('StudentData', studentDataSchema);
