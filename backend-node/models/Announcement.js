const mongoose = require('mongoose');

/**
 * Announcement Model
 * 
 * System-wide and targeted announcements for students
 */
const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required']
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Announcement type
  type: {
    type: String,
    enum: ['general', 'placement', 'job', 'event', 'urgent', 'maintenance'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Target audience
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'placed_students', 'unplaced_students', 'specific_branch', 'specific_year'],
    default: 'all'
  },
  // Specific targeting
  targetBranches: {
    type: [String],
    default: []
  },
  targetYears: {
    type: [Number],
    default: []
  },
  // Visibility and status
  isPublished: {
    type: Boolean,
    default: false
  },
  publishDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  // Related entities
  relatedJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  relatedDriveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlacementDrive',
    default: null
  },
  // Engagement tracking
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  // Email notification
  sendEmailNotification: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
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

// Indexes
announcementSchema.index({ collegeId: 1, isPublished: 1 });
announcementSchema.index({ collegeId: 1, isPinned: 1 });
announcementSchema.index({ createdAt: -1 });

// Update timestamp
announcementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if announcement is active
announcementSchema.methods.isActive = function() {
  const now = new Date();
  if (!this.isPublished) return false;
  if (this.publishDate && now < this.publishDate) return false;
  if (this.expiryDate && now > this.expiryDate) return false;
  return true;
};

// Check if user has viewed announcement
announcementSchema.methods.hasUserViewed = function(userId) {
  return this.viewedBy.some(v => v.userId.toString() === userId.toString());
};

// Mark as viewed by user
announcementSchema.methods.markAsViewed = async function(userId) {
  if (!this.hasUserViewed(userId)) {
    this.viewedBy.push({ userId, viewedAt: new Date() });
    this.views += 1;
    await this.save();
  }
};

module.exports = mongoose.model('Announcement', announcementSchema);
