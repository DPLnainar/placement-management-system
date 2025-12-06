import { Router } from 'express';
import { authenticate, requireRole } from '@middleware/auth';
import * as applicationController from '../controllers/applicationController';

const router = Router();

/**
 * Application Routes
 */

// All routes require authentication
router.use(authenticate);

// Student: Apply to a job
router.post('/', requireRole(['student']), applicationController.createApplication);

// Get applications (students see their own, admins/moderators see all)
router.get('/', applicationController.getApplications);

// Admin/Moderator: Update application status
router.put('/:id/status', requireRole(['admin', 'moderator']), applicationController.updateApplicationStatus);

// Admin/Moderator: Add rejection reason
router.put('/:id/rejection', requireRole(['admin', 'moderator']), applicationController.addRejectionReason);

export default router;
