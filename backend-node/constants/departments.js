/**
 * Department/Branch Constants
 * Standardized department codes for the placement portal
 * Used across the application for consistency
 */

const DEPARTMENTS = {
  CSE: 'Computer Science and Engineering',
  ECE: 'Electronics and Communication Engineering',
  EEE: 'Electrical and Electronics Engineering',
  IT: 'Information Technology',
  MECH: 'Mechanical Engineering',
  CIVIL: 'Civil Engineering',
  ISE: 'Information Science and Engineering',
  AI_ML: 'Artificial Intelligence and Machine Learning',
  AIDS: 'Artificial Intelligence and Data Science',
  DS: 'Data Science',
  MBA: 'Master of Business Administration',
  MCA: 'Master of Computer Applications'
};

// Department codes array for validation
const DEPARTMENT_CODES = Object.keys(DEPARTMENTS);

// Department full names array
const DEPARTMENT_NAMES = Object.values(DEPARTMENTS);

/**
 * Validate if a department code is valid
 * @param {string} code - Department code to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDepartment = (code) => {
  return DEPARTMENT_CODES.includes(code);
};

/**
 * Validate if all department codes in an array are valid
 * @param {Array<string>} codes - Array of department codes
 * @returns {Object} - { valid: boolean, invalidCodes: Array }
 */
const validateDepartments = (codes) => {
  if (!Array.isArray(codes)) {
    return { valid: false, invalidCodes: [], error: 'Departments must be an array' };
  }
  
  const invalidCodes = codes.filter(code => !isValidDepartment(code));
  
  return {
    valid: invalidCodes.length === 0,
    invalidCodes
  };
};

/**
 * Get department full name from code
 * @param {string} code - Department code
 * @returns {string} - Full department name or code if not found
 */
const getDepartmentName = (code) => {
  return DEPARTMENTS[code] || code;
};

module.exports = {
  DEPARTMENTS,
  DEPARTMENT_CODES,
  DEPARTMENT_NAMES,
  isValidDepartment,
  validateDepartments,
  getDepartmentName
};
