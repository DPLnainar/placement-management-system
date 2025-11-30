const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: false,  // Optional for SuperAdmin users
    index: true
  },
  
  // User information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  userRole: {
    type: String,
    enum: ['superadmin', 'admin', 'moderator', 'student'],
    required: true
  },
  
  userName: String,
  userEmail: String,
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'login_failed',
      'password_change',
      'password_reset',
      'user_create',
      'user_update',
      'user_delete',
      'user_status_change',
      'job_create',
      'job_update',
      'job_delete',
      'job_status_change',
      'application_submit',
      'application_update',
      'application_approve',
      'application_reject',
      'student_register',
      'student_profile_update',
      'placement_drive_create',
      'placement_drive_update',
      'placement_drive_delete',
      'announcement_create',
      'announcement_update',
      'announcement_delete',
      'event_create',
      'event_update',
      'event_delete',
      'file_upload',
      'file_delete',
      'data_export',
      'data_import',
      'settings_change',
      'permission_change',
      'other'
    ],
    index: true
  },
  
  // Resource details
  resourceType: {
    type: String,
    enum: ['User', 'Job', 'Application', 'StudentData', 'PlacementDrive', 'Announcement', 'Event', 'File', 'Settings', 'Other']
  },
  
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  resourceName: String,
  
  // Request details
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  
  endpoint: String,
  
  ipAddress: String,
  
  userAgent: String,
  
  // Changes made
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fieldsChanged: [String]
  },
  
  // Additional details
  description: String,
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success',
    index: true
  },
  
  errorMessage: String,
  
  // Security flags
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Metadata
  duration: Number, // Request duration in ms
  
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ college: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, user: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, status: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, severity: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, isSuspicious: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });

// TTL index - auto-delete logs older than 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 365 days

// Static methods
auditLogSchema.statics.logAction = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error - logging should not break the application
    return null;
  }
};

auditLogSchema.statics.getRecentLogs = async function(college, limit = 50) {
  return this.find({ college })
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

auditLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

auditLogSchema.statics.getSuspiciousActivity = async function(college) {
  return this.find({ 
    college,
    $or: [
      { isSuspicious: true },
      { severity: { $in: ['high', 'critical'] } },
      { status: 'failure' }
    ]
  })
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);
};

auditLogSchema.statics.getActivityStats = async function(college, startDate, endDate) {
  const match = { college };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return stats;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
