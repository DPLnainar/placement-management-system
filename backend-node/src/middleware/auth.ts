import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@models/index';
import type { IAuthRequest } from '../types/index';

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
export const authenticate = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        message: 'No token provided, authorization denied' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
      
      // Load user from database (excluding password)
      const user = await User.findById(decoded.userId)
        .select('-password')
        .populate('collegeId', 'name code location');
      
      if (!user) {
        res.status(401).json({ 
          success: false, 
          message: 'User not found, token invalid' 
        });
        return;
      }

      // Check if user is active
      if (user.status !== 'active') {
        res.status(401).json({ 
          success: false, 
          message: 'User account is not active' 
        });
        return;
      }

      // Attach user to request object
      req.user = {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        name: (user as any).name || (user as any).fullName || user.username,
        status: user.status
      };
      
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ 
          success: false, 
          message: 'Token expired, please login again' 
        });
        return;
      }
      
      res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
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
export const requireRole = (roles: string[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
      return;
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
 */
export const requireSameCollege = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }

  // SuperAdmin can access all colleges - bypass check
  if (req.user.role === 'superadmin') {
    req.collegeId = req.params.collegeId || req.body.collegeId || req.query.collegeId || undefined;
    req.isSuperAdmin = true;
    next();
    return;
  }

  // Get collegeId from various sources
  const requestedCollegeId = 
    req.params.collegeId || 
    req.body.collegeId || 
    req.query.collegeId;

  // If no college specified in request, assume user's own college
  if (!requestedCollegeId) {
    req.collegeId = (req.user.collegeId as any)?._id || req.user.collegeId;
    next();
    return;
  }

  // Check if requested college matches user's college
  const userCollegeId = (req.user.collegeId as any)?._id || req.user.collegeId;
  
  if (requestedCollegeId.toString() !== userCollegeId.toString()) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access data from your assigned college.' 
    });
    return;
  }

  req.collegeId = userCollegeId;
  next();
};

/**
 * Middleware to ensure only admins can assign users to their college
 */
export const requireAdminForAssignment = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }

  // Only admins and superadmins can assign users
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Insufficient permissions.' 
    });
    return;
  }

  // SuperAdmin can assign to any college
  if (req.user.role === 'superadmin') {
    if (!req.body.collegeId) {
      res.status(400).json({ 
        success: false, 
        message: 'SuperAdmin must specify collegeId when creating users' 
      });
      return;
    }
    next();
    return;
  }

  // If collegeId is specified in request body, it must match admin's college
  if (req.body.collegeId) {
    const userCollegeId = (req.user.collegeId as any)?._id || req.user.collegeId;
    
    if (req.body.collegeId.toString() !== userCollegeId.toString()) {
      res.status(403).json({ 
        success: false, 
        message: 'You can only assign users to your own college' 
      });
      return;
    }
  } else {
    // If no collegeId specified, automatically set it to admin's college
    req.body.collegeId = (req.user.collegeId as any)?._id || req.user.collegeId;
  }

  next();
};

/**
 * VERIFY COLLEGE ADMIN MIDDLEWARE
 * 
 * ⚠️ CRITICAL SECURITY FUNCTION ⚠️
 */
export const verifyCollegeAdmin = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }

  // Check if user is a College Admin
  if (req.user.role !== 'admin') {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Insufficient permissions.' 
    });
    return;
  }

  // Ensure admin has a college assigned
  if (!req.user.collegeId) {
    res.status(403).json({ 
      success: false, 
      message: 'Admin account not properly configured. No college assigned.' 
    });
    return;
  }

  // Attach college_id to request - THIS is what enforces data isolation
  req.collegeId = (req.user.collegeId as any)?._id || req.user.collegeId;
  req.college = req.user.collegeId;

  next();
};

// Aliases for consistency with other routes
export const protect = authenticate;
export const authorize = requireRole;
