const mongoose = require('mongoose');

/**
 * Job Model
 * 
 * Represents a job posting in the system.
 * Each job belongs to a college and can only be accessed by users from that college.
 * Only admins and moderators can create/edit jobs.
 * Students can view and apply for jobs from their college.
 */
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  salary: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract'],
    default: 'full-time'
  },
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  // Separate registration deadline (can be before application deadline)
  registrationDeadline: {
    type: Date,
    default: null
  },
  // Deadline extensions
  deadlineExtended: {
    type: Boolean,
    default: false
  },
  originalDeadline: {
    type: Date,
    default: null
  },
  // Application tracking
  maxApplications: {
    type: Number,
    default: null // null means unlimited
  },
  currentApplicationCount: {
    type: Number,
    default: 0
  },
  // Reference to the college this job belongs to
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College assignment is required']
  },
  // Track who posted this job
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'closed', 'cancelled'],
    default: 'draft'
  },
  // Job category and type
  jobCategory: {
    type: String,
    enum: ['campus_placement', 'off_campus', 'internship', 'ppo', 'pool_campus'],
    default: 'campus_placement'
  },
  companyTier: {
    type: String,
    enum: ['super_dream', 'dream', 'normal'],
    default: 'normal'
  },
  // Comprehensive eligibility criteria
  eligibilityCriteria: {
    // Academic requirements
    minCGPA: { type: Number, min: 0, max: 10, default: 0 },
    minTenthPercentage: { type: Number, min: 0, max: 100, default: 0 },
    minTwelfthPercentage: { type: Number, min: 0, max: 100, default: 0 },
    
    // Backlog restrictions
    maxBacklogsAllowed: { type: Number, min: 0, default: 0 },
    maxCurrentBacklogs: { type: Number, min: 0, default: 0 },
    
    // Branch eligibility
    eligibleBranches: { type: [String], default: [] },
    
    // Year of study
    eligibleYears: { type: [Number], default: [4] },
    
    // Gender preference (if any)
    genderPreference: { 
      type: String, 
      enum: ['all', 'male', 'female', 'other'],
      default: 'all'
    },
    
    // Gap year restrictions
    maxGapYears: { type: Number, default: 2 },
    
    // Required skills
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    
    // Required certifications
    requiredCertifications: { type: [String], default: [] },
    
    // Additional criteria
    otherCriteria: { type: String, default: null }
  },
  // Job requirements (percentages, cgpa, skills) - Legacy field
  requirements: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Interview process configuration
  interviewProcess: {
    hasPrePlacementTalk: { type: Boolean, default: false },
    prePlacementTalkDate: { type: Date },
    
    hasAptitudeRound: { type: Boolean, default: false },
    aptitudeDetails: { type: String },
    
    hasTechnicalRound: { type: Boolean, default: false },
    technicalRoundCount: { type: Number, min: 0, max: 5, default: 1 },
    technicalDetails: { type: String },
    
    hasHRRound: { type: Boolean, default: false },
    hrDetails: { type: String },
    
    hasGroupDiscussion: { type: Boolean, default: false },
    gdDetails: { type: String },
    
    totalRounds: { type: Number, min: 1, default: 1 },
    processDescription: { type: String }
  },
  // Salary and package details
  packageDetails: {
    ctc: { type: Number },
    baseSalary: { type: Number },
    joiningBonus: { type: Number },
    performanceBonus: { type: Number },
    stockOptions: { type: Boolean, default: false },
    other: { type: String },
    breakdown: { type: String }
  },
  // Job posting details
  numberOfPositions: {
    type: Number,
    min: 1,
    default: 1
  },
  workLocation: {
    type: String,
    default: null
  },
  workMode: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    default: 'onsite'
  },
  bondDuration: {
    type: Number,
    min: 0,
    default: 0
  },
  bondDetails: {
    type: String,
    default: null
  },
  // Notification settings
  notifyEligibleStudents: {
    type: Boolean,
    default: false
  },
  notificationsSent: {
    type: Boolean,
    default: false
  },
  // Visibility settings
  isVisible: {
    type: Boolean,
    default: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  // Tags for better searchability
  tags: {
    type: [String],
    default: []
  },
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient querying
jobSchema.index({ collegeId: 1, status: 1 });
jobSchema.index({ collegeId: 1, jobCategory: 1 });
jobSchema.index({ collegeId: 1, deadline: 1 });
jobSchema.index({ postedBy: 1 });

// Check if job deadline has passed
jobSchema.methods.isExpired = function() {
  return new Date() > this.deadline;
};

// Check if registration is still open
jobSchema.methods.isRegistrationOpen = function() {
  const now = new Date();
  
  // Check if job is active
  if (this.status !== 'active') return false;
  
  // Check registration deadline if exists
  if (this.registrationDeadline && now > this.registrationDeadline) {
    return false;
  }
  
  // Check application deadline
  if (now > this.deadline) return false;
  
  // Check max applications limit
  if (this.maxApplications && this.currentApplicationCount >= this.maxApplications) {
    return false;
  }
  
  return true;
};

// Get days remaining until deadline
jobSchema.methods.getDaysRemaining = function() {
  const now = new Date();
  const deadline = this.registrationDeadline || this.deadline;
  const timeDiff = deadline - now;
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

// Check if job is closing soon (within 3 days)
jobSchema.methods.isClosingSoon = function() {
  const daysRemaining = this.getDaysRemaining();
  return daysRemaining > 0 && daysRemaining <= 3;
};

// Extend deadline
jobSchema.methods.extendDeadline = function(newDeadline) {
  if (!this.deadlineExtended) {
    this.originalDeadline = this.deadline;
    this.deadlineExtended = true;
  }
  this.deadline = newDeadline;
};

// Check if student is eligible for this job
jobSchema.methods.checkEligibility = function(studentData) {
  const criteria = this.eligibilityCriteria;
  const issues = [];

  // Check CGPA
  if (criteria.minCGPA && studentData.cgpa < criteria.minCGPA) {
    issues.push(`Minimum CGPA required: ${criteria.minCGPA}`);
  }

  // Check 10th percentage
  if (criteria.minTenthPercentage && studentData.tenthPercentage < criteria.minTenthPercentage) {
    issues.push(`Minimum 10th percentage required: ${criteria.minTenthPercentage}%`);
  }

  // Check 12th percentage
  if (criteria.minTwelfthPercentage && studentData.twelfthPercentage < criteria.minTwelfthPercentage) {
    issues.push(`Minimum 12th percentage required: ${criteria.minTwelfthPercentage}%`);
  }

  // Check backlogs
  if (criteria.maxBacklogsAllowed !== undefined && studentData.totalBacklogs > criteria.maxBacklogsAllowed) {
    issues.push(`Maximum backlogs allowed: ${criteria.maxBacklogsAllowed}`);
  }

  if (criteria.maxCurrentBacklogs !== undefined && studentData.currentBacklogs > criteria.maxCurrentBacklogs) {
    issues.push(`No current backlogs allowed`);
  }

  // Check branch
  if (criteria.eligibleBranches.length > 0 && !criteria.eligibleBranches.includes(studentData.branch)) {
    issues.push(`Branch not eligible. Eligible branches: ${criteria.eligibleBranches.join(', ')}`);
  }

  // Check year of study
  if (criteria.eligibleYears.length > 0 && !criteria.eligibleYears.includes(studentData.yearOfStudy)) {
    issues.push(`Year of study not eligible`);
  }

  // Check gap years
  if (criteria.maxGapYears !== undefined && studentData.gapYears > criteria.maxGapYears) {
    issues.push(`Maximum gap years allowed: ${criteria.maxGapYears}`);
  }

  return {
    isEligible: issues.length === 0,
    issues: issues
  };
};

module.exports = mongoose.model('Job', jobSchema);
