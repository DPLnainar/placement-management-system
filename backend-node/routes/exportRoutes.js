const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { exportLimiter } = require('../middleware/rateLimiter');
const exportController = require('../controllers/exportController');

// All routes require authentication and admin/moderator role
router.use(protect);
router.use(authorize('admin', 'moderator', 'superadmin'));

// Apply rate limiting to exports
router.use(exportLimiter);

// Export routes
router.get('/students', exportController.exportStudents);
router.get('/applications', exportController.exportApplications);
router.get('/placement-report', exportController.generatePlacementReport);

// Import routes
router.post('/students/import', authorize('admin', 'superadmin'), exportController.importStudents);

module.exports = router;
