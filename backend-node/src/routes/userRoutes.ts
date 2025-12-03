import { Router } from 'express';
// Commented out until userController is migrated
// import { authenticate, requireRole, requireSameCollege, requireAdminForAssignment, verifyCollegeAdmin } from '@middleware/auth';

const router = Router();

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
// router.use(authenticate);

// Temporarily disabled until userController is migrated
// Admin and Moderator: Create user
// router.post('/', requireRole(['admin', 'moderator']), requireSameCollege, createUser);

// Admin and Moderator: View users in their college
// router.get('/', requireRole(['admin', 'moderator']), requireSameCollege, getCollegeUsers);

// Admin, Moderator, and Student: View specific user
// router.get('/:id', requireRole(['admin', 'moderator', 'student']), getUserById);

// Admin, Moderator, and Student: Update user details
// router.put('/:id', requireRole(['admin', 'moderator', 'student']), updateUser);

// Admin and Moderator: Update user status
// router.put('/:id/status', requireRole(['admin', 'moderator']), updateUserStatus);

// Admin only: Update user approval
// router.put('/:id/approve', requireRole(['admin']), updateUserApproval);

// Admin only: Delete user
// router.delete('/:id', requireRole(['admin']), deleteUser);

export default router;
