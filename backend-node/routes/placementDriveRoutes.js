const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const placementDriveController = require('../controllers/placementDriveController');

/**
 * Placement Drive Routes
 * Manages placement seasons and campaigns
 */

// Create new drive (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(['admin']),
  placementDriveController.createDrive
);

// Get all drives
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'moderator', 'student']),
  placementDriveController.getDrives
);

// Get active drive
router.get(
  '/active',
  authenticate,
  requireRole(['admin', 'moderator', 'student']),
  placementDriveController.getActiveDrive
);

// Get drive dashboard/analytics
router.get(
  '/:id/dashboard',
  authenticate,
  requireRole(['admin', 'moderator']),
  placementDriveController.getDriveDashboard
);

// Update drive
router.put(
  '/:id',
  authenticate,
  requireRole(['admin']),
  placementDriveController.updateDrive
);

// Update drive statistics
router.post(
  '/:id/update-stats',
  authenticate,
  requireRole(['admin', 'moderator']),
  placementDriveController.updateDriveStatistics
);

// Add announcement
router.post(
  '/:id/announcements',
  authenticate,
  requireRole(['admin', 'moderator']),
  placementDriveController.addAnnouncement
);

// Freeze/Unfreeze drive
router.post(
  '/:id/toggle-freeze',
  authenticate,
  requireRole(['admin']),
  placementDriveController.toggleFreeze
);

module.exports = router;
