import { Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import type { IAuthRequest } from '../types/index';
import type { AuditAction, ResourceType, HttpMethod } from '../models/AuditLog';

/**
 * Map HTTP methods to audit actions
 */
const mapMethodToAction = (method: string, endpoint: string): AuditAction => {
  const endpointLower = endpoint.toLowerCase();
  
  // Job-related actions
  if (endpointLower.includes('/jobs')) {
    if (method === 'POST') return 'job_create';
    if (method === 'PUT' || method === 'PATCH') return 'job_update';
    if (method === 'DELETE') return 'job_delete';
    return 'other';
  }
  
  // Application-related actions
  if (endpointLower.includes('/applications')) {
    if (method === 'POST') return 'application_submit';
    if (method === 'PUT' || method === 'PATCH') return 'application_update';
    return 'other';
  }
  
  // User-related actions
  if (endpointLower.includes('/users')) {
    if (method === 'POST') return 'user_create';
    if (method === 'PUT' || method === 'PATCH') return 'user_update';
    if (method === 'DELETE') return 'user_delete';
    return 'other';
  }
  
  // Student-related actions
  if (endpointLower.includes('/students')) {
    if (method === 'POST') return 'student_register';
    if (method === 'PUT' || method === 'PATCH') return 'student_profile_update';
    return 'other';
  }
  
  // Placement drive actions
  if (endpointLower.includes('/placement-drives')) {
    if (method === 'POST') return 'placement_drive_create';
    if (method === 'PUT' || method === 'PATCH') return 'placement_drive_update';
    if (method === 'DELETE') return 'placement_drive_delete';
    return 'other';
  }
  
  // Announcement actions
  if (endpointLower.includes('/announcements')) {
    if (method === 'POST') return 'announcement_create';
    if (method === 'PUT' || method === 'PATCH') return 'announcement_update';
    if (method === 'DELETE') return 'announcement_delete';
    return 'other';
  }
  
  // Event actions
  if (endpointLower.includes('/events')) {
    if (method === 'POST') return 'event_create';
    if (method === 'PUT' || method === 'PATCH') return 'event_update';
    if (method === 'DELETE') return 'event_delete';
    return 'other';
  }
  
  // File operations
  if (endpointLower.includes('/upload')) return 'file_upload';
  if (endpointLower.includes('/export')) return 'data_export';
  
  return 'other';
};

/**
 * Extract resource type from endpoint
 */
const extractResourceType = (endpoint: string): ResourceType | undefined => {
  const endpointLower = endpoint.toLowerCase();
  
  if (endpointLower.includes('/users')) return 'User';
  if (endpointLower.includes('/jobs')) return 'Job';
  if (endpointLower.includes('/applications')) return 'Application';
  if (endpointLower.includes('/students')) return 'StudentData';
  if (endpointLower.includes('/placement-drives')) return 'PlacementDrive';
  if (endpointLower.includes('/announcements')) return 'Announcement';
  if (endpointLower.includes('/events')) return 'Event';
  if (endpointLower.includes('/upload') || endpointLower.includes('/file')) return 'File';
  
  return 'Other';
};

/**
 * Audit middleware for logging authenticated user actions
 * 
 * This middleware should be placed AFTER authentication middleware
 * It logs all mutating operations (POST, PUT, PATCH, DELETE) to the AuditLog collection
 * 
 * Logged information:
 * - Actor (user ID, role, email)
 * - Action type (create, update, delete, etc.)
 * - Resource type and ID
 * - HTTP method and endpoint
 * - IP address and user agent
 * - Timestamp
 * - Status (success/failure)
 * 
 * GET requests are not logged to reduce noise, unless they involve sensitive operations
 */
export const auditMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Only log authenticated requests
  if (!req.user) {
    next();
    return;
  }

  // Skip audit for GET requests (read operations) to reduce log volume
  // Exception: sensitive endpoints should be logged
  const sensitiveGetEndpoints = ['/export', '/audit', '/statistics', '/report'];
  const isSensitiveGet = req.method === 'GET' && 
    sensitiveGetEndpoints.some(endpoint => req.path.includes(endpoint));
  
  if (req.method === 'GET' && !isSensitiveGet) {
    next();
    return;
  }

  // Skip audit logging endpoints to avoid recursion
  if (req.path.includes('/audit')) {
    next();
    return;
  }

  // Capture start time for duration calculation
  const startTime = Date.now();

  // Store original res.json to intercept response
  const originalJson = res.json.bind(res);
  let responseData: any = null;
  let responseStatus = 200;

  // Override res.json to capture response
  res.json = function (data: any): Response {
    responseData = data;
    responseStatus = res.statusCode;
    return originalJson(data);
  };

  // Store original res.status to capture status
  const originalStatus = res.status.bind(res);
  res.status = function (code: number): Response {
    responseStatus = code;
    return originalStatus(code);
  };

  // Continue with request processing
  next();

  // Log after response is sent (on finish event)
  res.on('finish', async () => {
    try {
      // Guard: Only log if user is authenticated
      if (!req.user) return;
      
      // Store user reference for TypeScript null safety
      const user = req.user;
      
      const duration = Date.now() - startTime;
      const action = mapMethodToAction(req.method, req.path);
      const resourceType = extractResourceType(req.path);
      
      // Extract resource ID from URL params or body
      const resourceId = req.params.id || req.body.id || req.body._id;
      
      // Determine status based on response code
      const status = responseStatus >= 200 && responseStatus < 300 ? 'success' : 
                    responseStatus >= 400 && responseStatus < 500 ? 'warning' : 'failure';
      
      // Determine severity
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (req.method === 'DELETE') severity = 'medium';
      if (action.includes('delete') || action.includes('status_change')) severity = 'high';
      if (status === 'failure' && user.role === 'superadmin') severity = 'critical';
      
      // Check for suspicious activity
      const isSuspicious = 
        (status === 'failure' && responseStatus === 403) || // Unauthorized access attempt
        (req.method === 'DELETE' && user.role === 'student') || // Student trying to delete
        (responseStatus === 401); // Authentication failure

      // Create audit log entry
      await AuditLog.create({
        college: user.collegeId || undefined,
        user: user._id,
        userRole: user.role,
        userName: user.name,
        userEmail: user.email,
        action,
        resourceType,
        resourceId: resourceId || undefined,
        resourceName: responseData?.data?.name || responseData?.data?.title || undefined,
        method: req.method as HttpMethod,
        endpoint: req.path,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        changes: {
          before: undefined, // Could be populated for UPDATE operations if needed
          after: req.body || undefined,
          fieldsChanged: req.body ? Object.keys(req.body) : []
        },
        description: `${user.role} ${user.name} performed ${action} on ${resourceType}`,
        status,
        errorMessage: status !== 'success' ? responseData?.message : undefined,
        severity,
        isSuspicious,
        duration,
        metadata: {
          query: req.query,
          params: req.params,
          responseCode: responseStatus
        }
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Audit logging error:', error);
    }
  });
};

/**
 * Middleware to manually log specific actions
 * Useful for custom logging that doesn't fit the automatic pattern
 */
export const logAction = async (
  req: IAuthRequest,
  action: AuditAction,
  resourceType: ResourceType,
  resourceId?: string,
  description?: string,
  metadata?: any
): Promise<void> => {
  try {
    if (!req.user) return;

    const user = req.user; // Store reference to avoid repeated checks

    await AuditLog.create({
      college: user.collegeId || undefined,
      user: user._id,
      userRole: user.role,
      userName: user.name,
      userEmail: user.email,
      action,
      resourceType,
      resourceId: resourceId || undefined,
      method: req.method as HttpMethod,
      endpoint: req.path,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      description: description || `${user.role} performed ${action}`,
      status: 'success',
      severity: 'low',
      isSuspicious: false,
      metadata
    });
  } catch (error) {
    console.error('Manual audit logging error:', error);
  }
};

export default auditMiddleware;
