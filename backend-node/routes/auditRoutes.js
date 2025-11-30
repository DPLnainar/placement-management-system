const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const auditController = require('../controllers/auditController');

// All routes require authentication and admin/moderator role
router.use(protect);
router.use(authorize('admin', 'moderator', 'superadmin'));

// Get audit logs with filters
router.get('/', auditController.getAuditLogs);

// Get recent activity
router.get('/recent', auditController.getRecentActivity);

// Get user activity
router.get('/user/:userId?', auditController.getUserActivity);

// Get suspicious activity
router.get('/suspicious', auditController.getSuspiciousActivity);

// Get activity statistics
router.get('/statistics', auditController.getActivityStats);

// Get login history
router.get('/login-history', auditController.getLoginHistory);

// Delete old logs (admin only)
router.delete('/cleanup', authorize('admin', 'superadmin'), auditController.deleteOldLogs);

module.exports = router;
