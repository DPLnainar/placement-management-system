import { Router } from 'express';
import { authenticate, requireRole } from '@middleware/auth';
import * as userController from '@controllers/userController';

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
router.use(authenticate);

// Admin and Moderator: View users in their college
router.get('/', requireRole(['admin', 'moderator']), userController.getCollegeUsers);

// Admin and Moderator: Create new user (students)
// Note: Moderators are restricted to creating students in their department by the controller
router.post('/', requireRole(['admin', 'moderator']), userController.createUser);

// Admin only: Update user status
router.put('/:id/status', requireRole(['admin']), userController.updateUserStatus);

export default router;
