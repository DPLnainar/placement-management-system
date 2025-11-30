const mongoose = require('mongoose');

/**
 * Application Model - Multi-stage placement workflow
 * 
 * Tracks student applications through various stages:
 * eligible → applied → shortlisted → aptitude → technical → hr → selected → offered → joined
 */
const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  // Application workflow status
  status: {
    type: String,
    enum: [
      'pending',           // Initial application submitted
      'under_review',      // Being reviewed by admin/moderator
      'shortlisted',       // Shortlisted for interview
      'aptitude_scheduled', // Aptitude test scheduled
      'aptitude_cleared',   // Cleared aptitude round
      'aptitude_rejected',  // Rejected in aptitude
      'technical_scheduled', // Technical interview scheduled
      'technical_cleared',   // Cleared technical round
      'technical_rejected',  // Rejected in technical
      'hr_scheduled',        // HR interview scheduled
      'hr_cleared',          // Cleared HR round
      'hr_rejected',         // Rejected in HR
      'selected',            // Final selection
      'offered',             // Offer made
      'offer_accepted',      // Student accepted offer
      'offer_rejected',      // Student rejected offer
      'joined',              // Student joined company
      'rejected',            // Overall rejection
      'withdrawn'            // Student withdrew application
    ],
    default: 'pending'
  },
  // Current round information
  currentRound: {
    type: String,
    enum: ['application', 'aptitude', 'technical', 'hr', 'final'],
    default: 'application'
  },
  // Detailed round tracking
  rounds: [{
    roundName: { type: String, required: true },
    roundType: { 
      type: String, 
      enum: ['aptitude', 'technical', 'hr', 'gd', 'other'],
      required: true
    },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    status: { 
      type: String, 
      enum: ['scheduled', 'completed', 'cleared', 'rejected', 'absent'],
      default: 'scheduled'
    },
    score: { type: Number },
    feedback: { type: String },
    interviewerName: { type: String },
    notes: { type: String },
    conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  // Eligibility check
  eligibilityCheck: {
    isEligible: { type: Boolean, default: null },
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedDate: { type: Date },
    eligibilityIssues: { type: [String], default: [] },
    overrideReason: { type: String }
  },
  // Selection and offer details
  selectionDetails: {
    selectedDate: { type: Date },
    selectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    offeredCTC: { type: Number },
    offeredRole: { type: String },
    offerLetterSent: { type: Boolean, default: false },
    offerLetterDate: { type: Date },
    offerLetterUrl: { type: String },
    joiningDate: { type: Date },
    joiningLocation: { type: String }
  },
  // Admin/Moderator actions
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: null
  },
  // Priority and flags
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    default: null
  },
  // Communication tracking
  notifications: [{
    type: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String }
  }],
  // Resume and documents
  resumeSubmitted: {
    type: String,
    default: null
  },
  additionalDocuments: [{
    name: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  appliedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
// Additional indexes for efficient queries
applicationSchema.index({ collegeId: 1, status: 1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ studentId: 1, status: 1 });
applicationSchema.index({ collegeId: 1, currentRound: 1 });

// Methods
applicationSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.lastUpdatedBy = updatedBy;
  return this.save();
};

applicationSchema.methods.addRound = function(roundData) {
  this.rounds.push(roundData);
  return this.save();
};

applicationSchema.methods.sendNotification = function(type, message, sentBy) {
  this.notifications.push({ type, message, sentBy });
  return this.save();
};

module.exports = mongoose.model('Application', applicationSchema);
