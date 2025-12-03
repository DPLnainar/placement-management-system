import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Application Routes
 * Temporarily disabled until applicationController is migrated
 */

// All routes require authentication
// router.use(authenticate);

// Student: Apply to a job
// router.post('/', requireRole(['student']), createApplication);

// Get applications (students see their own, admins/moderators see all)
// router.get('/', getApplications);

// Admin/Moderator: Update application status
// router.put('/:id/status', requireRole(['admin', 'moderator']), updateApplicationStatus);

export default router;
