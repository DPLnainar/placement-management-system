import { Document, Schema, model, Model } from 'mongoose';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'user_status_change'
  | 'job_create'
  | 'job_update'
  | 'job_delete'
  | 'job_status_change'
  | 'application_submit'
  | 'application_update'
  | 'application_approve'
  | 'application_reject'
  | 'student_register'
  | 'student_profile_update'
  | 'placement_drive_create'
  | 'placement_drive_update'
  | 'placement_drive_delete'
  | 'announcement_create'
  | 'announcement_update'
  | 'announcement_delete'
  | 'event_create'
  | 'event_update'
  | 'event_delete'
  | 'file_upload'
  | 'file_delete'
  | 'data_export'
  | 'data_import'
  | 'settings_change'
  | 'permission_change'
  | 'other';

export type UserRole = 'superadmin' | 'admin' | 'moderator' | 'student';
export type ResourceType = 'User' | 'Job' | 'Application' | 'StudentData' | 'PlacementDrive' | 'Announcement' | 'Event' | 'File' | 'Settings' | 'Other';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AuditStatus = 'success' | 'failure' | 'warning';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface IChanges {
  before?: any;
  after?: any;
  fieldsChanged?: string[];
}

export interface IAuditLog extends Document {
  college?: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  action: AuditAction;
  resourceType?: ResourceType;
  resourceId?: Schema.Types.ObjectId;
  resourceName?: string;
  method?: HttpMethod;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
  changes: IChanges;
  description?: string;
  status: AuditStatus;
  errorMessage?: string;
  severity: Severity;
  isSuspicious: boolean;
  duration?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface IAuditLogStatics {
  logAction(data: any): Promise<IAuditLog | null>;
  getRecentLogs(college: Schema.Types.ObjectId, limit?: number): Promise<IAuditLog[]>;
  getUserActivity(userId: Schema.Types.ObjectId, limit?: number): Promise<IAuditLog[]>;
  getSuspiciousActivity(college: Schema.Types.ObjectId): Promise<IAuditLog[]>;
  getActivityStats(college: Schema.Types.ObjectId, startDate?: Date, endDate?: Date): Promise<any[]>;
}

type AuditLogModelType = Model<IAuditLog> & IAuditLogStatics;

/**
 * AuditLog Schema Definition
 */
const auditLogSchema = new Schema<IAuditLog>(
  {
    college: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: false,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['superadmin', 'admin', 'moderator', 'student'],
      required: true,
    },
    userName: { type: String },
    userEmail: { type: String },
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
        'other',
      ],
      index: true,
    },
    resourceType: {
      type: String,
      enum: [
        'User',
        'Job',
        'Application',
        'StudentData',
        'PlacementDrive',
        'Announcement',
        'Event',
        'File',
        'Settings',
        'Other',
      ],
    },
    resourceId: { type: Schema.Types.ObjectId },
    resourceName: { type: String },
    method: { type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    endpoint: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
      fieldsChanged: { type: [String], default: [] },
    },
    description: { type: String },
    status: {
      type: String,
      enum: ['success', 'failure', 'warning'],
      default: 'success',
      index: true,
    },
    errorMessage: { type: String },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    isSuspicious: { type: Boolean, default: false, index: true },
    duration: { type: Number },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
auditLogSchema.index({ college: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, user: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, status: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, severity: 1, createdAt: -1 });
auditLogSchema.index({ college: 1, isSuspicious: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });

// TTL index - auto-delete logs older than 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

/**
 * Log action
 */
auditLogSchema.static('logAction', async function (data: any): Promise<IAuditLog | null> {
  try {
    const log = new this(data) as IAuditLog;
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
});

/**
 * Get recent logs
 */
auditLogSchema.static(
  'getRecentLogs',
  async function (college: Schema.Types.ObjectId, limit = 50): Promise<IAuditLog[]> {
    return this.find({ college })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
);

/**
 * Get user activity
 */
auditLogSchema.static(
  'getUserActivity',
  async function (userId: Schema.Types.ObjectId, limit = 50): Promise<IAuditLog[]> {
    return this.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
);

/**
 * Get suspicious activity
 */
auditLogSchema.static(
  'getSuspiciousActivity',
  async function (college: Schema.Types.ObjectId): Promise<IAuditLog[]> {
    return this.find({
      college,
      $or: [
        { isSuspicious: true },
        { severity: { $in: ['high', 'critical'] } },
        { status: 'failure' },
      ],
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
  }
);

/**
 * Get activity statistics
 */
auditLogSchema.static(
  'getActivityStats',
  async function (college: Schema.Types.ObjectId, startDate?: Date, endDate?: Date): Promise<any[]> {
    const match: any = { college };

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
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return stats;
  }
);

export default model<IAuditLog, AuditLogModelType>('AuditLog', auditLogSchema);
