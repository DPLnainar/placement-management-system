const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    index: true
  },
  
  displayName: String,
  
  logo: String,
  
  website: String,
  
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
      'Other'
    ]
  },
  
  companySize: {
    type: String,
    enum: ['1-50', '51-200', '201-500', '501-1000', '1000+']
  },
  
  headquarters: {
    city: String,
    state: String,
    country: String
  },
  
  description: {
    type: String,
    maxlength: 2000
  },
  
  // Contact Information
  contactPerson: {
    name: String,
    designation: String,
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: String,
    alternatePhone: String
  },
  
  hrContacts: [{
    name: String,
    email: String,
    phone: String,
    designation: String
  }],
  
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  
  // Portal Access (if company can login)
  portalAccess: {
    enabled: {
      type: Boolean,
      default: false
    },
    username: {
      type: String,
      unique: true,
      sparse: true
    },
    password: {
      type: String,
      select: false
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Placement History
  placementHistory: [{
    year: Number,
    studentsHired: Number,
    averagePackage: Number,
    highestPackage: Number,
    roles: [String],
    feedback: String
  }],
  
  // Company Tier Classification
  tier: {
    type: String,
    enum: ['super_dream', 'dream', 'normal'],
    default: 'normal'
  },
  
  // Preferences
  preferredBranches: [String],
  
  preferredSkills: [String],
  
  minimumCGPA: {
    type: Number,
    min: 0,
    max: 10
  },
  
  allowBacklogs: {
    type: Boolean,
    default: true
  },
  
  maxBacklogs: {
    type: Number,
    default: 0
  },
  
  // Documents
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Social Links
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  
  // Statistics
  stats: {
    totalJobsPosted: {
      type: Number,
      default: 0
    },
    totalStudentsHired: {
      type: Number,
      default: 0
    },
    activeJobs: {
      type: Number,
      default: 0
    },
    lastVisitDate: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active',
    index: true
  },
  
  blacklistReason: String,
  
  // Ratings and Reviews
  rating: {
    overall: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    workCulture: Number,
    compensation: Number,
    growthOpportunities: Number,
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  
  reviews: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notes (admin only)
  notes: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
companySchema.index({ college: 1, name: 1 });
companySchema.index({ college: 1, status: 1 });
companySchema.index({ college: 1, tier: 1 });
companySchema.index({ 'portalAccess.username': 1 }, { sparse: true });

// Methods
companySchema.methods.updateStats = async function() {
  const Job = mongoose.model('Job');
  
  const totalJobs = await Job.countDocuments({ 
    collegeId: this.college,
    'company.name': this.name
  });
  
  const activeJobs = await Job.countDocuments({ 
    collegeId: this.college,
    'company.name': this.name,
    status: 'active'
  });
  
  this.stats.totalJobsPosted = totalJobs;
  this.stats.activeJobs = activeJobs;
  
  return this.save();
};

companySchema.methods.addReview = function(studentId, rating, reviewText) {
  this.reviews.push({
    student: studentId,
    rating,
    review: reviewText
  });
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.rating.overall = totalRating / this.reviews.length;
  this.rating.reviewCount = this.reviews.length;
  
  return this.save();
};

module.exports = mongoose.model('Company', companySchema);
