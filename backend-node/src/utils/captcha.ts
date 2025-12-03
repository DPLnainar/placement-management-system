import crypto from 'crypto';

interface CaptchaData {
  captchaId: string;
  captchaCode: string;
  expiresAt: Date;
}

// In-memory store for captcha codes (in production, use Redis)
const captchaStore = new Map<string, { code: string; expiresAt: Date }>();

/**
 * Generate a 4-digit numeric captcha
 * @returns Object containing captchaId and captchaCode
 */
export const generateCaptcha = (): CaptchaData => {
  // Generate 4-digit random number
  const captchaCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Generate unique captcha ID
  const captchaId = crypto.randomBytes(16).toString('hex');
  
  // Set expiry to 5 minutes from now
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  // Store captcha
  captchaStore.set(captchaId, { code: captchaCode, expiresAt });
  
  return {
    captchaId,
    captchaCode,
    expiresAt
  };
};

/**
 * Validate captcha code against captchaId
 * @param captchaId - Unique captcha identifier
 * @param captchaInput - User-provided captcha code
 * @returns boolean indicating if captcha is valid
 */
export const validateCaptcha = (captchaId: string, captchaInput: string): boolean => {
  const captchaData = captchaStore.get(captchaId);
  
  if (!captchaData) {
    return false; // Captcha not found
  }
  
  // Check if captcha has expired
  if (new Date() > captchaData.expiresAt) {
    captchaStore.delete(captchaId);
    return false; // Captcha expired
  }
  
  // Validate captcha code
  const isValid = captchaData.code === captchaInput;
  
  // Delete captcha after validation (one-time use)
  captchaStore.delete(captchaId);
  
  return isValid;
};

/**
 * Clean up expired captchas periodically
 */
export const cleanupExpiredCaptchas = (): void => {
  const now = new Date();
  
  for (const [captchaId, data] of captchaStore.entries()) {
    if (now > data.expiresAt) {
      captchaStore.delete(captchaId);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupExpiredCaptchas, 10 * 60 * 1000);
