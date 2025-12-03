import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import * as authController from '@controllers/authController';

const router = Router();

/**
 * Authentication Routes
 * 
 * POST /api/auth/login - Login without college selection (auto-links to assigned college)
 * POST /api/auth/register-invited - Complete registration using invitation token
 * POST /api/auth/forgot-password - Request password reset
 * POST /api/auth/reset-password - Reset password with token
 * GET /api/auth/captcha - Get captcha for login
 * POST /api/auth/logout - Logout and clear refresh token
 * POST /api/auth/refresh-token - Refresh access token
 * GET /api/auth/profile - Get current user's profile
 * PUT /api/auth/change-password - Change password
 */

// Public routes
router.get('/captcha', authController.getCaptcha);
router.post('/login', authController.login);
router.post('/register-invited', authController.registerInvited);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshAccessToken);

// Protected routes (require authentication)
router.get('/profile', authenticate, authController.getProfile);
router.put('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
