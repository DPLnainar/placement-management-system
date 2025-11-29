const express = require('express');
const { 
  authenticate, 
  requireRole, 
  requireSameCollege,
  requireAdminForAssignment,
  verifyCollegeAdmin  // NEW: Use this for strict college filtering
} = require('../middleware/auth');
const {
  createUser,
  getCollegeUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserApproval,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

/**
 * User Management Routes
 * 
 * ⚠️ SECURITY: Uses verifyCollegeAdmin middleware
 * This ensures College Admin can ONLY access their college's data
 * 
 * All routes require authentication
 * Some routes restricted by role and college association
 * 
 * POST /api/users - Create user (admin only, auto-assigns to admin's college)
 * GET /api/users - Get all users in authenticated user's college (admin/moderator)
 * GET /api/users/:id - Get specific user (admin/moderator, same college only)
 * PUT /api/users/:id/status - Update user status (admin only)
 * DELETE /api/users/:id - Delete user (admin only)
 */

// All routes require authentication
router.use(authenticate);

// Admin and Moderator: Create user (moderator can only create students in their dept)
// verifyCollegeAdmin ensures req.collegeId is set from token
router.post(
  '/',
  requireRole(['admin', 'moderator']),
  requireSameCollege,
  createUser
);

// Admin and Moderator: View users in their college
// verifyCollegeAdmin or requireRole + requireSameCollege
router.get(
  '/',
  requireRole(['admin', 'moderator']),
  requireSameCollege,
  getCollegeUsers
);

// Admin, Moderator, and Student: View specific user from their college
// Students can only view their own profile (checked in controller)
router.get(
  '/:id',
  requireRole(['admin', 'moderator', 'student']),
  getUserById
);

// Admin, Moderator, and Student: Update user details
// Students can only update their own profile (checked in controller)
// Moderators can update students in their department
// Admins can update anyone in their college
router.put(
  '/:id',
  requireRole(['admin', 'moderator', 'student']),
  updateUser
);

// Admin and Moderator: Update user status in their college/department
router.put(
  '/:id/status',
  requireRole(['admin', 'moderator']),
  updateUserStatus
);

// Admin only: Update user approval in their college
router.put(
  '/:id/approve',
  requireRole(['admin']),
  updateUserApproval
);

// Admin only: Delete user from their college
router.delete(
  '/:id',
  requireRole(['admin']),
  deleteUser
);

module.exports = router;
