const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const statisticsController = require('../controllers/statisticsController');

/**
 * Statistics Routes
 * 
 * All routes require authentication
 * Admin/Moderator only access
 */

// All routes require authentication and admin/moderator role
router.use(authenticate);
router.use(requireRole(['admin', 'moderator']));

// Get comprehensive placement statistics
router.get('/placement', statisticsController.getPlacementStatistics);

// Get year-wise placement trends
router.get('/placement/trends', statisticsController.getPlacementTrends);

// Get student-wise statistics
router.get('/students', statisticsController.getStudentStatistics);

// Get company statistics
router.get('/companies', statisticsController.getCompanyStatistics);

// Export placement report
router.get('/export/placements', statisticsController.exportPlacementReport);

module.exports = router;
