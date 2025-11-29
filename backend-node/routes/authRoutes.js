const express = require('express');
const { authenticate, requireRole, requireSameCollege } = require('../middleware/auth');
const { login, getProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

/**
 * Authentication Routes
 * 
 * POST /api/auth/login - Login without college selection (auto-links to assigned college)
 * POST /api/auth/forgot-password - Request password reset
 * POST /api/auth/reset-password - Reset password with token
 * GET /api/auth/profile - Get current user's profile
 * PUT /api/auth/change-password - Change password
 */

// Public routes
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.get('/profile', authenticate, getProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
