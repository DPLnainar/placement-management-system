/**
 * Input Validation Middleware
 * 
 * Provides reusable validation functions for API endpoints
 * Prevents invalid data from reaching controllers
 */

const mongoose = require('mongoose');
const { validateDepartments } = require('../constants/departments');

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName] || req.query[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required`
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of fields) {
      if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Validate email format
 */
const validateEmail = (fieldName = 'email') => {
  return (req, res, next) => {
    const email = req.body[fieldName];
    
    if (!email) {
      return next();
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    next();
  };
};

/**
 * Validate username format
 */
const validateUsername = (req, res, next) => {
  const username = req.body.username;
  
  if (!username) {
    return next();
  }
  
  // Username: 3-30 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
    });
  }
  
  next();
};

/**
 * Validate password strength
 */
const validatePassword = (req, res, next) => {
  const password = req.body.password;
  
  if (!password) {
    return next();
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  next();
};

/**
 * Validate numeric range
 */
const validateRange = (fieldName, min, max) => {
  return (req, res, next) => {
    const value = req.body[fieldName];
    
    if (value === undefined || value === null) {
      return next();
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a number`
      });
    }
    
    if (numValue < min || numValue > max) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be between ${min} and ${max}`
      });
    }
    
    next();
  };
};

/**
 * Validate enum values
 */
const validateEnum = (fieldName, allowedValues) => {
  return (req, res, next) => {
    const value = req.body[fieldName] || req.query[fieldName] || req.params[fieldName];
    
    if (!value) {
      return next();
    }
    
    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Sanitize input to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

/**
 * Validate date format
 */
const validateDate = (fieldName) => {
  return (req, res, next) => {
    const dateValue = req.body[fieldName];
    
    if (!dateValue) {
      return next();
    }
    
    const date = new Date(dateValue);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be a valid date`
      });
    }
    
    next();
  };
};

/**
 * Validate job eligibility configuration (common vs department-wise)
 */
const validateJobEligibility = (req, res, next) => {
  const { eligibilityType, commonEligibility, departmentWiseEligibility } = req.body;
  
  // If no eligibility type specified, skip (will default to 'common')
  if (!eligibilityType) {
    return next();
  }
  
  // Validate eligibility type
  const validTypes = ['common', 'department-wise'];
  if (!validTypes.includes(eligibilityType)) {
    return res.status(400).json({
      success: false,
      message: `Eligibility type must be one of: ${validTypes.join(', ')}`
    });
  }
  
  // Validate common eligibility
  if (eligibilityType === 'common') {
    if (commonEligibility) {
      if (typeof commonEligibility.tenth !== 'number' || commonEligibility.tenth < 0 || commonEligibility.tenth > 100) {
        return res.status(400).json({
          success: false,
          message: 'Common eligibility: tenth percentage must be between 0-100'
        });
      }
      if (typeof commonEligibility.twelfth !== 'number' || commonEligibility.twelfth < 0 || commonEligibility.twelfth > 100) {
        return res.status(400).json({
          success: false,
          message: 'Common eligibility: twelfth percentage must be between 0-100'
        });
      }
      if (typeof commonEligibility.cgpa !== 'number' || commonEligibility.cgpa < 0 || commonEligibility.cgpa > 10) {
        return res.status(400).json({
          success: false,
          message: 'Common eligibility: CGPA must be between 0-10'
        });
      }
    }
  }
  
  // Validate department-wise eligibility
  if (eligibilityType === 'department-wise') {
    if (!departmentWiseEligibility || !Array.isArray(departmentWiseEligibility)) {
      return res.status(400).json({
        success: false,
        message: 'Department-wise eligibility requires an array of department criteria'
      });
    }
    
    if (departmentWiseEligibility.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one department criteria must be provided'
      });
    }
    
    // Validate each department criteria
    for (let i = 0; i < departmentWiseEligibility.length; i++) {
      const dept = departmentWiseEligibility[i];
      
      if (!dept.department) {
        return res.status(400).json({
          success: false,
          message: `Department name is required for criteria #${i + 1}`
        });
      }
      
      if (typeof dept.tenth !== 'number' || dept.tenth < 0 || dept.tenth > 100) {
        return res.status(400).json({
          success: false,
          message: `${dept.department}: tenth percentage must be between 0-100`
        });
      }
      
      if (typeof dept.twelfth !== 'number' || dept.twelfth < 0 || dept.twelfth > 100) {
        return res.status(400).json({
          success: false,
          message: `${dept.department}: twelfth percentage must be between 0-100`
        });
      }
      
      if (typeof dept.cgpa !== 'number' || dept.cgpa < 0 || dept.cgpa > 10) {
        return res.status(400).json({
          success: false,
          message: `${dept.department}: CGPA must be between 0-10`
        });
      }
    }
  }
  
  next();
};

module.exports = {
  validateObjectId,
  validateRequiredFields,
  validateEmail,
  validateUsername,
  validatePassword,
  validateRange,
  validateEnum,
  sanitizeInput,
  validateDate,
  validateJobEligibility
};
