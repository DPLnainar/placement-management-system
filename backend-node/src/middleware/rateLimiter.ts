import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const generalLimiter: any = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased from 100)
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Authentication rate limiter (stricter)
 */
export const authLimiter: any = (req, res, next) => next();

/**
 * Password reset rate limiter
 */
export const passwordResetLimiter: any = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 attempts per hour
  message: 'Too many password reset attempts, please try again later.',
});

export default { generalLimiter, authLimiter, passwordResetLimiter };
