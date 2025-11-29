const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  createApplication,
  getApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Application Routes
 */

// Student: Apply to a job
router.post(
  '/',
  requireRole(['student']),
  createApplication
);

// Get applications (students see their own, admins/moderators see all)
router.get(
  '/',
  getApplications
);

// Admin/Moderator: Update application status
router.put(
  '/:id/status',
  requireRole(['admin', 'moderator']),
  updateApplicationStatus
);

module.exports = router;
