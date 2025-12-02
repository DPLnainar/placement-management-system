const AuditLog = require('../models/AuditLog');

// Middleware to log all API actions
const auditMiddleware = async (req, res, next) => {
  // Skip audit logging for certain routes
  const skipRoutes = ['/api/auth/profile', '/', '/api/public', '/api/auth/login'];
  if (skipRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }
  
  const startTime = Date.now();
  
  // Store original send function
  const originalSend = res.send;
  
  // Override send function to capture response
  res.send = function(data) {
    // Restore original send
    res.send = originalSend;
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Create audit log (async, don't wait)
    if (req.user) {
      createAuditLog(req, res, duration, data).catch(err => {
        console.error('Audit log error:', err);
      });
    }
    
    // Send response
    return originalSend.call(this, data);
  };
  
  next();
};

// Helper function to create audit log
async function createAuditLog(req, res, duration, responseData) {
  try {
    // Determine action type
    const action = determineAction(req);
    
    // Extract resource info
    const resourceInfo = extractResourceInfo(req, responseData);
    
    // Determine severity
    const severity = determineSeverity(req, res);
    
    // Check if suspicious
    const isSuspicious = checkSuspiciousActivity(req, res);
    
    // Create log data
    const logData = {
      user: req.user._id,
      userRole: req.user.role,
      userName: req.user.name,
      userEmail: req.user.email,
      action,
      resourceType: resourceInfo.type,
      resourceId: resourceInfo.id,
      resourceName: resourceInfo.name,
      method: req.method,
      endpoint: req.originalUrl || req.url,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure',
      severity,
      isSuspicious,
      duration,
      description: generateDescription(action, resourceInfo, req.user)
    };
    
    // Add college if user has one (SuperAdmin doesn't have college)
    if (req.user.college) {
      logData.college = req.user.college;
    }
    
    // Add error message if failure
    if (logData.status === 'failure' && typeof responseData === 'string') {
      try {
        const parsed = JSON.parse(responseData);
        if (parsed.message) {
          logData.errorMessage = parsed.message;
        }
      } catch (e) {
        // Not JSON, skip
      }
    }
    
    // Create audit log
    await AuditLog.logAction(logData);
  } catch (error) {
    console.error('Error in createAuditLog:', error);
  }
}

// Determine action type from request
function determineAction(req) {
  const path = req.path.toLowerCase();
  const method = req.method;
  
  // Authentication actions
  if (path.includes('/login')) {
    return 'login';
  }
  if (path.includes('/logout')) {
    return 'logout';
  }
  if (path.includes('/change-password')) {
    return 'password_change';
  }
  if (path.includes('/reset-password')) {
    return 'password_reset';
  }
  
  // User actions
  if (path.includes('/users')) {
    if (method === 'POST') return 'user_create';
    if (method === 'PUT' || method === 'PATCH') {
      if (path.includes('/status')) return 'user_status_change';
      return 'user_update';
    }
    if (method === 'DELETE') return 'user_delete';
  }
  
  // Job actions
  if (path.includes('/jobs')) {
    if (method === 'POST') return 'job_create';
    if (method === 'PUT' || method === 'PATCH') {
      if (path.includes('/status')) return 'job_status_change';
      return 'job_update';
    }
    if (method === 'DELETE') return 'job_delete';
  }
  
  // Application actions
  if (path.includes('/applications')) {
    if (method === 'POST') return 'application_submit';
    if (method === 'PUT' || method === 'PATCH') {
      if (path.includes('/approve')) return 'application_approve';
      if (path.includes('/reject')) return 'application_reject';
      return 'application_update';
    }
  }
  
  // Student actions
  if (path.includes('/students')) {
    if (path.includes('/register')) return 'student_register';
    if (method === 'PUT' || method === 'PATCH') return 'student_profile_update';
  }
  
  // Placement drive actions
  if (path.includes('/placement-drives')) {
    if (method === 'POST') return 'placement_drive_create';
    if (method === 'PUT' || method === 'PATCH') return 'placement_drive_update';
    if (method === 'DELETE') return 'placement_drive_delete';
  }
  
  // Announcement actions
  if (path.includes('/announcements')) {
    if (method === 'POST') return 'announcement_create';
    if (method === 'PUT' || method === 'PATCH') return 'announcement_update';
    if (method === 'DELETE') return 'announcement_delete';
  }
  
  // Event actions
  if (path.includes('/events')) {
    if (method === 'POST') return 'event_create';
    if (method === 'PUT' || method === 'PATCH') return 'event_update';
    if (method === 'DELETE') return 'event_delete';
  }
  
  // File actions
  if (path.includes('/upload')) {
    if (method === 'POST') return 'file_upload';
    if (method === 'DELETE') return 'file_delete';
  }
  
  // Export/Import
  if (path.includes('/export')) return 'data_export';
  if (path.includes('/import')) return 'data_import';
  
  return 'other';
}

// Extract resource information
function extractResourceInfo(req, responseData) {
  const info = {
    type: 'Other',
    id: null,
    name: null
  };
  
  const path = req.path.toLowerCase();
  
  if (path.includes('/users')) info.type = 'User';
  else if (path.includes('/jobs')) info.type = 'Job';
  else if (path.includes('/applications')) info.type = 'Application';
  else if (path.includes('/students')) info.type = 'StudentData';
  else if (path.includes('/placement-drives')) info.type = 'PlacementDrive';
  else if (path.includes('/announcements')) info.type = 'Announcement';
  else if (path.includes('/events')) info.type = 'Event';
  else if (path.includes('/upload')) info.type = 'File';
  
  // Extract ID from path
  const idMatch = req.path.match(/\/([a-f0-9]{24})/i);
  if (idMatch) {
    info.id = idMatch[1];
  }
  
  // Try to extract name from request body
  if (req.body && req.body.title) {
    info.name = req.body.title;
  } else if (req.body && req.body.name) {
    info.name = req.body.name;
  }
  
  return info;
}

// Determine severity level
function determineSeverity(req, res) {
  const action = determineAction(req);
  const statusCode = res.statusCode;
  
  // Failed actions are more severe
  if (statusCode >= 400) {
    if (action === 'login') return 'medium';
    if (action.includes('delete')) return 'high';
    return 'low';
  }
  
  // Critical actions
  const criticalActions = ['user_delete', 'job_delete', 'permission_change'];
  if (criticalActions.includes(action)) return 'critical';
  
  // High severity actions
  const highActions = ['user_create', 'user_status_change', 'job_status_change', 'password_reset'];
  if (highActions.includes(action)) return 'high';
  
  // Medium severity actions
  const mediumActions = ['user_update', 'job_create', 'job_update', 'application_approve', 'application_reject'];
  if (mediumActions.includes(action)) return 'medium';
  
  return 'low';
}

// Check for suspicious activity
function checkSuspiciousActivity(req, res) {
  // Multiple failed login attempts
  if (req.path.includes('/login') && res.statusCode >= 400) {
    return true;
  }
  
  // Unauthorized access attempts
  if (res.statusCode === 403 || res.statusCode === 401) {
    return true;
  }
  
  // Delete operations by non-admin users
  if (req.method === 'DELETE' && req.user && req.user.role === 'student') {
    return true;
  }
  
  return false;
}

// Generate description
function generateDescription(action, resourceInfo, user) {
  const actionMap = {
    login: 'logged in',
    logout: 'logged out',
    login_failed: 'failed login attempt',
    password_change: 'changed password',
    password_reset: 'reset password',
    user_create: `created user`,
    user_update: `updated user`,
    user_delete: `deleted user`,
    job_create: `created job`,
    job_update: `updated job`,
    job_delete: `deleted job`,
    application_submit: `submitted application`,
    student_register: `registered as student`,
    student_profile_update: `updated student profile`,
    file_upload: `uploaded file`,
    file_delete: `deleted file`,
    data_export: `exported data`,
  };
  
  let description = `${user.name} (${user.role}) ${actionMap[action] || action}`;
  
  if (resourceInfo.name) {
    description += ` "${resourceInfo.name}"`;
  } else if (resourceInfo.id) {
    description += ` (ID: ${resourceInfo.id})`;
  }
  
  return description;
}

module.exports = { auditMiddleware };
