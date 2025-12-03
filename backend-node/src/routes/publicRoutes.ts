import { Router } from 'express';
import * as authController from '@controllers/authController';

const router = Router();

/**
 * Public Routes
 * No authentication required
 */

// Get list of active colleges
router.get('/colleges', authController.getPublicColleges);

// Verify invitation token (will be implemented when invitationController is migrated)
// router.get('/verify/:token', verifyInvitation);

export default router;
