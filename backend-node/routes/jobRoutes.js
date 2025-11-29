const express = require('express');
const { 
  authenticate, 
  requireRole, 
  requireSameCollege 
} = require('../middleware/auth');
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
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

// Admin and Moderator: Delete job from their college
router.delete(
  '/:id',
  requireRole(['admin', 'moderator']),
  deleteJob
);

module.exports = router;
