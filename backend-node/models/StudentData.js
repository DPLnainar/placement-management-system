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
  // Skills categorization
  skills: {
    type: [String],
    default: []
  },
  technicalSkills: {
    programming: { type: [String], default: [] },
    frameworks: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    databases: { type: [String], default: [] },
    cloud: { type: [String], default: [] },
    other: { type: [String], default: [] }
  },
  softSkills: {
    type: [String],
    default: []
  },
  // Certifications
  certifications: [{
    name: { type: String, required: true },
    issuedBy: { type: String },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String },
    credentialUrl: { type: String }
  }],
  // Projects
  projects: [{
    title: { type: String, required: true },
    description: { type: String },
    technologies: { type: [String], default: [] },
    role: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    projectUrl: { type: String },
    githubUrl: { type: String }
  }],
  // Achievements
  achievements: [{
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date },
    category: { 
      type: String, 
      enum: ['academic', 'sports', 'cultural', 'technical', 'other'],
      default: 'other'
    }
  }],
  // Internships
  internships: [{
    company: { type: String, required: true },
    role: { type: String },
    description: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    stipend: { type: String },
    location: { type: String },
    technologies: { type: [String], default: [] }
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

// Update the updatedAt timestamp before saving
studentDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentData', studentDataSchema);
