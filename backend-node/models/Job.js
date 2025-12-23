const mongoose = require('mongoose');
const { DEPARTMENT_CODES, validateDepartments } = require('../constants/departments');

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
  // Department category - which department(s) this job belongs to
  departmentCategory: {
    isCommonForAll: { type: Boolean, default: true }, // If true, job is common for all departments
    specificDepartments: { type: [String], default: [] }, // If isCommonForAll is false, specify departments
  },
  companyTier: {
    type: String,
    enum: ['super_dream', 'dream', 'normal'],
    default: 'normal'
  },
  // Eligibility Type: common for all departments or different for each department
  eligibilityType: {
    type: String,
    enum: ['common', 'department-wise'],
    default: 'common',
    required: true
  },
  
  // Common eligibility - applies to all departments
  commonEligibility: {
    tenth: { type: Number, min: 0, max: 100, default: 0 },
    twelfth: { type: Number, min: 0, max: 100, default: 0 },
    cgpa: { type: Number, min: 0, max: 10, default: 0 }
  },
  
  // Department-wise eligibility - different criteria per department
  departmentWiseEligibility: [
    {
      department: {
        type: String,
        enum: DEPARTMENT_CODES,
        required: function() { return this.eligibilityType === 'department-wise'; }
      },
      tenth: { type: Number, min: 0, max: 100, default: 0 },
      twelfth: { type: Number, min: 0, max: 100, default: 0 },
      cgpa: { type: Number, min: 0, max: 10, default: 0 }
    }
  ],

  // Legacy standardized eligibility field (kept for backward compatibility)
  eligibility: {
    type: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all',
      required: true
    },
    departments: {
      type: [String],
      default: [],
      validate: {
        validator: function(departments) {
          // If type is 'specific', departments array must not be empty
          if (this.eligibility && this.eligibility.type === 'specific') {
            if (!departments || departments.length === 0) {
              return false;
            }
            // Validate department codes - allow both predefined codes AND custom department names
            const validation = validateDepartments(departments);
            // If some are invalid, they might be custom department names (from "Others" field)
            // So we allow them anyway - custom departments are valid
            return true;
          }
          return true;
        },
        message: function(props) {
          if (!props.value || props.value.length === 0) {
            return 'Departments array cannot be empty when eligibility type is "specific"';
          }
          return 'Department validation failed';
        }
      }
    }
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
<<<<<<< Updated upstream
    
    // Branch/Department eligibility
    openToAllBranches: { type: Boolean, default: true }, // If true, all branches are eligible
    eligibleBranches: { type: [String], default: [] }, // Specific branches if openToAllBranches is false
    
=======

    // Branch eligibility
    eligibleBranches: { type: [String], default: [] },

>>>>>>> Stashed changes
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
jobSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient querying
jobSchema.index({ collegeId: 1, status: 1 });
jobSchema.index({ collegeId: 1, jobCategory: 1 });
jobSchema.index({ collegeId: 1, deadline: 1 });
jobSchema.index({ collegeId: 1, deadline: 1 });
jobSchema.index({ collegeId: 1, status: 1, jobCategory: 1 }); // Optimized for dashboard job feeds

// Check if job deadline has passed
jobSchema.methods.isExpired = function () {
  return new Date() > this.deadline;
};

// Check if registration is still open
jobSchema.methods.isRegistrationOpen = function () {
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
jobSchema.methods.getDaysRemaining = function () {
  const now = new Date();
  const deadline = this.registrationDeadline || this.deadline;
  const timeDiff = deadline - now;
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

// Check if job is closing soon (within 3 days)
jobSchema.methods.isClosingSoon = function () {
  const daysRemaining = this.getDaysRemaining();
  return daysRemaining > 0 && daysRemaining <= 3;
};

// Extend deadline
jobSchema.methods.extendDeadline = function (newDeadline) {
  if (!this.deadlineExtended) {
    this.originalDeadline = this.deadline;
    this.deadlineExtended = true;
  }
  this.deadline = newDeadline;
};

// Check if student is eligible for this job
<<<<<<< Updated upstream
jobSchema.methods.checkEligibility = function(studentData) {
=======
jobSchema.methods.checkEligibility = function (studentData) {
  const criteria = this.eligibilityCriteria;
>>>>>>> Stashed changes
  const issues = [];

  // ===== NEW: Check eligibility criteria (common or department-wise) =====
  
  // If eligibility type is 'common', all students meeting common criteria are eligible
  if (this.eligibilityType === 'common' && this.commonEligibility) {
    const common = this.commonEligibility;
    
    if (common.tenth && studentData.tenthPercentage < common.tenth) {
      issues.push(`Minimum 10th percentage required: ${common.tenth}%`);
    }
    
    if (common.twelfth && studentData.twelfthPercentage < common.twelfth) {
      issues.push(`Minimum 12th percentage required: ${common.twelfth}%`);
    }
    
    if (common.cgpa && studentData.cgpa < common.cgpa) {
      issues.push(`Minimum CGPA required: ${common.cgpa}`);
    }
  }
  
  // If eligibility type is 'department-wise', check specific department criteria
  if (this.eligibilityType === 'department-wise' && this.departmentWiseEligibility && this.departmentWiseEligibility.length > 0) {
    const studentDept = studentData.branch;
    const deptCriteria = this.departmentWiseEligibility.find(d => d.department === studentDept);
    
    if (!deptCriteria) {
      issues.push(`Your department (${studentDept}) is not eligible for this job`);
    } else {
      if (deptCriteria.tenth && studentData.tenthPercentage < deptCriteria.tenth) {
        issues.push(`Minimum 10th percentage required for ${studentDept}: ${deptCriteria.tenth}%`);
      }
      
      if (deptCriteria.twelfth && studentData.twelfthPercentage < deptCriteria.twelfth) {
        issues.push(`Minimum 12th percentage required for ${studentDept}: ${deptCriteria.twelfth}%`);
      }
      
      if (deptCriteria.cgpa && studentData.cgpa < deptCriteria.cgpa) {
        issues.push(`Minimum CGPA required for ${studentDept}: ${deptCriteria.cgpa}`);
      }
    }
  }

  // ===== OLD: Check eligibility criteria (legacy) =====
  const criteria = this.eligibilityCriteria;

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
  if (!criteria.openToAllBranches && criteria.eligibleBranches.length > 0) {
    // If restricted to specific branches, check if student's branch is in the list
    if (!criteria.eligibleBranches.includes(studentData.branch)) {
      issues.push(`Branch not eligible. Eligible branches: ${criteria.eligibleBranches.join(', ')}`);
    }
  }
  // If openToAllBranches is true, all branches are eligible (no check needed)

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

/**
 * Check if a student is eligible based on the eligibility field (department-based)
 * @param {Object} student - Student object with department field
 * @returns {boolean} - True if eligible, false otherwise
 */
jobSchema.methods.checkStudentEligibility = function(student) {
  // If eligibility type is 'all', all students are eligible
  if (!this.eligibility || this.eligibility.type === 'all') {
    return true;
  }
  
  // If eligibility type is 'specific', check if student's department is in the list
  if (this.eligibility.type === 'specific') {
    const studentDept = student.department || student.branch;
    return this.eligibility.departments.includes(studentDept);
  }
  
  return false;
};

/**
 * Static helper to check student eligibility (can be called without instance)
 * @param {Object} job - Job object with eligibility field
 * @param {Object} student - Student object with department field
 * @returns {boolean} - True if eligible, false otherwise
 */
jobSchema.statics.checkStudentEligibility = function(job, student) {
  // If eligibility type is 'all', all students are eligible
  if (!job.eligibility || job.eligibility.type === 'all') {
    return true;
  }
  
  // If eligibility type is 'specific', check if student's department is in the list
  if (job.eligibility.type === 'specific') {
    const studentDept = student.department || student.branch;
    return job.eligibility.departments.includes(studentDept);
  }
  
  return false;
};

module.exports = mongoose.model('Job', jobSchema);
