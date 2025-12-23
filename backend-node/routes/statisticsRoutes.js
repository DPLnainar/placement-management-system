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

const cache = require('../middleware/cache');

// All routes require authentication and admin/moderator role
router.use(authenticate);
router.use(requireRole(['admin', 'moderator']));

// Get comprehensive placement statistics (Cache for 1 hour)
router.get('/placement', cache(3600), statisticsController.getPlacementStatistics);

// Get year-wise placement trends (Cache for 1 hour)
router.get('/placement/trends', cache(3600), statisticsController.getPlacementTrends);

// Get student-wise statistics (Cache for 15 mins)
router.get('/students', cache(900), statisticsController.getStudentStatistics);

// Get company statistics (Cache for 1 hour)
router.get('/companies', cache(3600), statisticsController.getCompanyStatistics);

// Export placement report
router.get('/export/placements', statisticsController.exportPlacementReport);

module.exports = router;
