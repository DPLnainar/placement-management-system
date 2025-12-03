import { Router } from 'express';

const router = Router();

/**
 * Public Routes
 * No authentication required
 * Temporarily disabled until controllers are migrated
 */

// Get list of active colleges
// router.get('/colleges', getPublicColleges);

// Verify invitation token and get invitation details
// router.get('/verify/:token', verifyInvitation);

export default router;
