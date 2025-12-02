const express = require('express');
const { 
  authenticate, 
  requireRole, 
  requireSameCollege 
} = require('../middleware/auth');
const {
  validateJobEligibility
} = require('../middleware/validation');
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  extendDeadline,
  checkEligibility,
  getJobStatistics,
  bulkUpdateStatus,
  closeExpiredJobs,
  getJobsClosingSoon,
  changeJobStatus
} = require('../controllers/jobController');

const router = express.Router();

/**
 * Job Routes
 * 
 * All routes require authentication
 * Jobs are scoped to user's college
 * 
 * POST /api/jobs - Create job (admin/moderator)
 * GET /api/jobs - Get all jobs in user's college (all roles)
 * GET /api/jobs/:id - Get specific job (all roles)
 * PUT /api/jobs/:id - Update job (admin/moderator)
 * DELETE /api/jobs/:id - Delete job (admin/moderator)
 */

// All routes require authentication
router.use(authenticate);

// All routes check college association
router.use(requireSameCollege);

// Admin and Moderator: Create job
router.post(
  '/',
  requireRole(['admin', 'moderator']),
  validateJobEligibility,
  createJob
);

// All roles: View jobs from their college
router.get('/', getJobs);

// All roles: View specific job from their college
router.get('/:id', getJobById);

// Admin and Moderator: Update job in their college
router.put(
  '/:id',
  requireRole(['admin', 'moderator']),
  updateJob
);

// Admin and Moderator: Change job status (active/closed/inactive)
router.put(
  '/:id/status',
  requireRole(['admin', 'moderator']),
  changeJobStatus
);

// Admin and Moderator: Delete job from their college
router.delete(
  '/:id',
  requireRole(['admin', 'moderator']),
  deleteJob
);

// Admin and Moderator: Extend job deadline
router.put(
  '/:id/extend-deadline',
  requireRole(['admin', 'moderator']),
  extendDeadline
);

// All roles: Check eligibility for a job
router.get(
  '/:id/check-eligibility',
  checkEligibility
);

// Admin and Moderator: Get job statistics
router.get(
  '/:id/statistics',
  requireRole(['admin', 'moderator']),
  getJobStatistics
);

// Admin: Bulk update job status
router.post(
  '/bulk/update-status',
  requireRole(['admin']),
  bulkUpdateStatus
);

// Admin and Moderator: Close expired jobs
router.post(
  '/bulk/close-expired',
  requireRole(['admin', 'moderator']),
  closeExpiredJobs
);

// All roles: Get jobs closing soon
router.get(
  '/special/closing-soon',
  getJobsClosingSoon
);

module.exports = router;
