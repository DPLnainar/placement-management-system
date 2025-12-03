import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Authentication rate limiter (stricter)
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

/**
 * Password reset rate limiter
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 attempts per hour
  message: 'Too many password reset attempts, please try again later.',
});

export default { generalLimiter, authLimiter, passwordResetLimiter };
