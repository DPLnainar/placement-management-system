/**
 * Password Strength Validation Utility
 */

export interface PasswordStrengthResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param password - Password to validate
 * @returns PasswordStrengthResult with validation details
 */
export const validatePasswordStrength = (password: string): PasswordStrengthResult => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Determine strength
  const criteriasMet = 5 - errors.length;
  
  if (criteriasMet === 5) {
    if (password.length >= 12) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  } else if (criteriasMet >= 3) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

/**
 * Check if password contains common patterns
 * @param password - Password to check
 * @returns boolean indicating if password has common patterns
 */
export const hasCommonPatterns = (password: string): boolean => {
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /welcome/i,
    /admin/i,
    /^12345678/
  ];

  return commonPatterns.some(pattern => pattern.test(password));
};

/**
 * Generate password strength score (0-100)
 * @param password - Password to score
 * @returns number between 0-100
 */
export const calculatePasswordScore = (password: string): number => {
  let score = 0;

  // Length score
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // Penalty for common patterns
  if (hasCommonPatterns(password)) score -= 30;

  // Penalty for repeated characters
  if (/(.)\1{2,}/.test(password)) score -= 10;

  return Math.max(0, Math.min(100, score));
};
