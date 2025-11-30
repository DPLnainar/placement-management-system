const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const eligibilityController = require('../controllers/eligibilityController');

/**
 * Eligibility Routes
 * Handles job-student eligibility matching and recommendations
 */

// Student routes
router.get(
  '/job/:jobId/check',
  authenticate,
  requireRole(['student']),
  eligibilityController.checkEligibility
);

router.get(
  '/jobs/eligible',
  authenticate,
  requireRole(['student']),
  eligibilityController.getEligibleJobs
);

router.get(
  '/jobs/recommendations',
  authenticate,
  requireRole(['student']),
  eligibilityController.getJobRecommendations
);

// Admin/Moderator routes
router.get(
  '/job/:jobId/students',
  authenticate,
  requireRole(['admin', 'moderator']),
  eligibilityController.getEligibleStudents
);

router.post(
  '/bulk-check',
  authenticate,
  requireRole(['admin', 'moderator']),
  eligibilityController.bulkEligibilityCheck
);

module.exports = router;
