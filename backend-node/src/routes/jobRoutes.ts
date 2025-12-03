import { Router } from 'express';
import { authenticate, requireRole, requireSameCollege } from '@middleware/auth';
import * as jobController from '@controllers/jobController';

const router = Router();

/**
 * Job Routes
 * 
 * All routes require authentication
 * Jobs are scoped to user's college
 */

// All routes require authentication
router.use(authenticate);

// All routes check college association
router.use(requireSameCollege);

// Admin and Moderator: Create job
router.post('/', requireRole(['admin', 'moderator']), jobController.createJob);

// All roles: View jobs from their college
router.get('/', jobController.getJobs);

// All roles: View specific job from their college
router.get('/:id', jobController.getJobById);

// Admin and Moderator: Update job
router.put('/:id', requireRole(['admin', 'moderator']), jobController.updateJob);

// Admin and Moderator: Change job status
router.put('/:id/status', requireRole(['admin', 'moderator']), jobController.changeJobStatus);

// Admin and Moderator: Delete job
router.delete('/:id', requireRole(['admin', 'moderator']), jobController.deleteJob);

// Admin and Moderator: Extend job deadline
router.put('/:id/extend-deadline', requireRole(['admin', 'moderator']), jobController.extendDeadline);

// All roles: Check eligibility for a job
router.get('/:id/check-eligibility', jobController.checkEligibility);

// Admin and Moderator: Get job statistics
router.get('/:id/statistics', requireRole(['admin', 'moderator']), jobController.getJobStatistics);

// Admin: Bulk update job status
router.post('/bulk/update-status', requireRole(['admin']), jobController.bulkUpdateStatus);

// Admin and Moderator: Close expired jobs
router.post('/bulk/close-expired', requireRole(['admin', 'moderator']), jobController.closeExpiredJobs);

// All roles: Get jobs closing soon
router.get('/special/closing-soon', jobController.getJobsClosingSoon);

export default router;
