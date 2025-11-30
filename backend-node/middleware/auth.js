const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and authenticate user
 * 
 * This middleware:
 * 1. Extracts JWT from Authorization header
 * 2. Verifies the token signature
 * 3. Loads user data from database
 * 4. Attaches user object to req.user for use in subsequent middleware/routes
 * 
 * The token payload includes: userId, role, collegeId
 * This allows for quick authorization checks without additional DB queries
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided, authorization denied' 
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Load user from database (excluding password)
      const user = await User.findById(decoded.userId)
        .select('-password')
        .populate('collegeId', 'name code location');
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found, token invalid' 
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(401).json({ 
          success: false, 
          message: 'User account is not active' 
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired, please login again' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * 
 * Usage: requireRole(['admin', 'moderator'])
 * 
 * This middleware must be used AFTER authenticate middleware
 * It checks if the authenticated user's role matches any of the required roles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

/**
 * Middleware to ensure the requested resource belongs to user's college
 * 
 * CRITICAL for multi-college isolation:
 * - Admins can only manage users/data in their college
 * - Moderators can only access data from their college
 * - Students can only see jobs/data from their college
 * - SuperAdmin can access ALL colleges (bypass check)
 * 
 * This middleware checks if the resource being accessed (identified by collegeId)
 * matches the authenticated user's college assignment
 * 
 * The collegeId can be in:
 * - req.params.collegeId
 * - req.body.collegeId
 * - req.query.collegeId
 * 
 * If no collegeId is provided in request, it assumes user wants to access
 * their own college's data (and sets req.collegeId = user's collegeId)
 */
const requireSameCollege = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  // SuperAdmin can access all colleges - bypass check
  if (req.user.role === 'superadmin') {
    // If a collegeId is specified, use it; otherwise allow all
    req.collegeId = req.params.collegeId || req.body.collegeId || req.query.collegeId || null;
    req.isSuperAdmin = true;
    return next();
  }

  // Get collegeId from various sources
  const requestedCollegeId = 
    req.params.collegeId || 
    req.body.collegeId || 
    req.query.collegeId;

  // If no college specified in request, assume user's own college
  if (!requestedCollegeId) {
    req.collegeId = req.user.collegeId._id || req.user.collegeId;
    return next();
  }

  // Check if requested college matches user's college
  const userCollegeId = req.user.collegeId._id || req.user.collegeId;
  
  if (requestedCollegeId.toString() !== userCollegeId.toString()) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access data from your assigned college.' 
    });
  }

  req.collegeId = userCollegeId;
  next();
};

/**
 * Middleware to ensure only admins can assign users to their college
 * 
 * This enforces the rule:
 * - Only admins (and superadmins) can create new users (moderators and students)
 * - Admins can only assign users to their own college
 * - SuperAdmins can assign users to any college
 * - The assigned user's collegeId must match admin's collegeId (unless SuperAdmin)
 */
const requireAdminForAssignment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  // Only admins and superadmins can assign users
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Insufficient permissions.' 
    });
  }

  // SuperAdmin can assign to any college
  if (req.user.role === 'superadmin') {
    // SuperAdmin must specify collegeId
    if (!req.body.collegeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'SuperAdmin must specify collegeId when creating users' 
      });
    }
    return next();
  }

  // If collegeId is specified in request body, it must match admin's college
  if (req.body.collegeId) {
    const userCollegeId = req.user.collegeId._id || req.user.collegeId;
    
    if (req.body.collegeId.toString() !== userCollegeId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only assign users to your own college' 
      });
    }
  } else {
    // If no collegeId specified, automatically set it to admin's college
    req.body.collegeId = req.user.collegeId._id || req.user.collegeId;
  }

  next();
};

/**
 * VERIFY COLLEGE ADMIN MIDDLEWARE
 * 
 * ⚠️ CRITICAL SECURITY FUNCTION ⚠️
 * 
 * This middleware:
 * 1. Verifies the user is authenticated
 * 2. Checks if the user has 'admin' role (College Admin)
 * 3. Attaches their college_id to req.collegeId
 * 4. PREVENTS cross-college data access by forcing all queries to filter by this college_id
 * 
 * Usage: Apply this to ALL College Admin routes that query/modify data
 * 
 * Example:
 *   router.get('/students', authenticate, verifyCollegeAdmin, getStudents);
 * 
 * In the controller, ALWAYS use req.collegeId for filtering:
 *   const students = await User.find({ collegeId: req.collegeId, role: 'student' });
 * 
 * NEVER accept collegeId from request params/body/query in College Admin routes!
 */
const verifyCollegeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  // Check if user is a College Admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Insufficient permissions.' 
    });
  }

  // Ensure admin has a college assigned
  if (!req.user.collegeId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin account not properly configured. No college assigned.' 
    });
  }

  // Attach college_id to request - THIS is what enforces data isolation
  req.collegeId = req.user.collegeId._id || req.user.collegeId;
  
  // Store college info for convenience
  req.college = req.user.collegeId;

  next();
};

module.exports = {
  authenticate,
  requireRole,
  requireSameCollege,
  requireAdminForAssignment,
  verifyCollegeAdmin,
  protect: authenticate, // Alias for consistency with other routes
  authorize: requireRole // Alias for consistency with other routes
};

