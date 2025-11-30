const mongoose = require('mongoose');

/**
 * PlacementDrive Model - Season/Campaign Management
 * 
 * Manages placement drives/seasons with specific rules and policies
 * Groups jobs under a placement drive with common policies
 */
const placementDriveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Drive name is required'],
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College reference is required']
  },
  // Drive timeline
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  registrationStartDate: {
    type: Date,
    default: null
  },
  registrationEndDate: {
    type: Date,
    default: null
  },
  // Drive status
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  // Drive type
  driveType: {
    type: String,
    enum: ['main_placement', 'summer_internship', 'winter_internship', 'pool_campus', 'off_campus'],
    default: 'main_placement'
  },
  // Placement policies
  policies: {
    // One offer rule
    oneOfferRule: {
      enabled: { type: Boolean, default: true },
      description: { type: String, default: 'Students can accept only one offer' }
    },
    
    // Company tier rules
    dreamCompanyRule: {
      enabled: { type: Boolean, default: true },
      allowMultipleApplications: { type: Boolean, default: false },
      description: { type: String }
    },
    
    // Application limits
    maxApplicationsPerStudent: {
      type: Number,
      min: 0,
      default: 0  // 0 means unlimited
    },
    
    // Post-placement application rules
    postPlacementRules: {
      canApplyAfterPlacement: { type: Boolean, default: false },
      onlyHigherCTC: { type: Boolean, default: true },
      minCTCDifference: { type: Number, default: 0 }
    },
    
    // Backlog and CGPA requirements
    globalCriteria: {
      minCGPA: { type: Number, default: 0 },
      maxBacklogs: { type: Number, default: 0 }
    }
  },
  // Target and statistics
  targets: {
    targetPlacementPercentage: { type: Number, min: 0, max: 100, default: 0 },
    targetCompaniesCount: { type: Number, min: 0, default: 0 },
    totalStudentsEligible: { type: Number, min: 0, default: 0 }
  },
  statistics: {
    totalJobsPosted: { type: Number, default: 0 },
    totalApplications: { type: Number, default: 0 },
    totalStudentsPlaced: { type: Number, default: 0 },
    totalOffersRolledOut: { type: Number, default: 0 },
    averageCTC: { type: Number, default: 0 },
    highestCTC: { type: Number, default: 0 },
    lowestCTC: { type: Number, default: 0 },
    placementPercentage: { type: Number, default: 0 }
  },
  // Coordinators
  coordinators: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['primary', 'secondary', 'department'] },
    department: { type: String }
  }],
  // Important notifications and announcements
  announcements: [{
    title: { type: String, required: true },
    message: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    targetAudience: { type: String, enum: ['all', 'placed', 'not_placed', 'specific_branch'], default: 'all' }
  }],
  // Company blacklist/whitelist
  companyRestrictions: {
    blacklistedCompanies: { type: [String], default: [] },
    whitelistedCompanies: { type: [String], default: [] }
  },
  // Important dates and events
  importantDates: [{
    event: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String }
  }],
  // Drive description and guidelines
  description: {
    type: String,
    default: null
  },
  guidelines: {
    type: String,
    default: null
  },
  // Freeze and emergency controls
  isFrozen: {
    type: Boolean,
    default: false
  },
  freezeReason: {
    type: String,
    default: null
  },
  freezeDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Update timestamp before saving
placementDriveSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
placementDriveSchema.index({ collegeId: 1, academicYear: 1 });
placementDriveSchema.index({ collegeId: 1, status: 1 });
placementDriveSchema.index({ startDate: 1, endDate: 1 });

// Methods
placementDriveSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.startDate && 
         now <= this.endDate &&
         !this.isFrozen;
};

placementDriveSchema.methods.canStudentApply = function(student, job) {
  // Check if drive is active
  if (!this.isActive()) {
    return { allowed: false, reason: 'Placement drive is not active' };
  }
  
  // Check max applications limit
  if (this.policies.maxApplicationsPerStudent > 0) {
    // This would need to be checked against actual application count
    // Implementation in controller
  }
  
  // Check if student is placed and post-placement rules
  if (student.placementStatus === 'placed') {
    if (!this.policies.postPlacementRules.canApplyAfterPlacement) {
      return { allowed: false, reason: 'Already placed students cannot apply' };
    }
    
    if (this.policies.postPlacementRules.onlyHigherCTC) {
      // Check CTC comparison - implementation in controller
    }
  }
  
  return { allowed: true };
};

placementDriveSchema.methods.updateStatistics = async function() {
  const Job = mongoose.model('Job');
  const Application = mongoose.model('Application');
  const StudentData = mongoose.model('StudentData');
  
  // Get all jobs for this drive
  const jobs = await Job.find({ 
    collegeId: this.collegeId,
    createdAt: { $gte: this.startDate, $lte: this.endDate }
  });
  
  this.statistics.totalJobsPosted = jobs.length;
  
  // Get all applications
  const applications = await Application.find({
    jobId: { $in: jobs.map(j => j._id) }
  });
  
  this.statistics.totalApplications = applications.length;
  
  // Get placed students
  const placedStudents = await StudentData.find({
    collegeId: this.collegeId,
    placementStatus: 'placed',
    placementDate: { $gte: this.startDate, $lte: this.endDate }
  });
  
  this.statistics.totalStudentsPlaced = placedStudents.length;
  
  // Calculate average, highest, lowest CTC
  if (placedStudents.length > 0) {
    const ctcs = placedStudents
      .filter(s => s.offerDetails && s.offerDetails.ctc)
      .map(s => s.offerDetails.ctc);
    
    if (ctcs.length > 0) {
      this.statistics.averageCTC = ctcs.reduce((a, b) => a + b, 0) / ctcs.length;
      this.statistics.highestCTC = Math.max(...ctcs);
      this.statistics.lowestCTC = Math.min(...ctcs);
    }
  }
  
  // Calculate placement percentage
  if (this.targets.totalStudentsEligible > 0) {
    this.statistics.placementPercentage = 
      (this.statistics.totalStudentsPlaced / this.targets.totalStudentsEligible) * 100;
  }
  
  return this.save();
};

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);
