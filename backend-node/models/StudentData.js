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
  // Skills
  skills: {
    type: [String],
    default: []
  },
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
    enum: ['not_placed', 'placed', 'opted_out'],
    default: 'not_placed'
  },
  placedCompany: {
    type: String,
    default: null
  },
  placementDate: {
    type: Date,
    default: null
  },
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
studentDataSchema.index({ userId: 1 });
studentDataSchema.index({ collegeId: 1 });
studentDataSchema.index({ collegeId: 1, documentsVerified: 1 });
studentDataSchema.index({ collegeId: 1, placementStatus: 1 });

// Update the updatedAt timestamp before saving
studentDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentData', studentDataSchema);
