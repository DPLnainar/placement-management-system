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
  '/check/:jobId',
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

// Student eligibility verification routes (Admin/Moderator)
router.get(
  '/student/:studentId/status',
  authenticate,
  requireRole(['admin', 'moderator']),
  eligibilityController.getStudentEligibilityStatus
);

router.post(
  '/student/:studentId/verify/personal',
  authenticate,
  requireRole(['admin', 'moderator']),
  eligibilityController.verifyPersonalInfo
);

router.post(
  '/student/:studentId/verify/academic',
  authenticate,
  requireRole(['admin', 'moderator']),
  eligibilityController.verifyAcademicInfo
);

module.exports = router;
