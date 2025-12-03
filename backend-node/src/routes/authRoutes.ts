import { Router } from 'express';
// import { authenticate, requireRole, requireSameCollege } from '@middleware/auth';

const router = Router();

/**
 * Authentication Routes
 * 
 * POST /api/auth/login - Login without college selection (auto-links to assigned college)
 * POST /api/auth/register-invited - Complete registration using invitation token
 * POST /api/auth/forgot-password - Request password reset
 * POST /api/auth/reset-password - Reset password with token
 * GET /api/auth/profile - Get current user's profile
 * PUT /api/auth/change-password - Change password
 */

// Public routes - Temporarily disabled until authController is migrated
// router.post('/login', login);
// router.post('/register-invited', registerInvited);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
// router.get('/profile', authenticate, getProfile);
// router.put('/change-password', authenticate, changePassword);

export default router;
