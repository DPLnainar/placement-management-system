const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const announcementController = require('../controllers/announcementController');

/**
 * Announcement Routes
 * 
 * All routes require authentication
 */

router.use(authenticate);

// Create announcement (Admin/Moderator only)
router.post('/', 
  requireRole(['admin', 'moderator']), 
  announcementController.createAnnouncement
);

// Get all announcements (All roles)
router.get('/', announcementController.getAnnouncements);

// Get unread count (Students)
router.get('/unread/count', announcementController.getUnreadCount);

// Get single announcement (All roles)
router.get('/:id', announcementController.getAnnouncementById);

// Update announcement (Admin/Moderator only)
router.put('/:id', 
  requireRole(['admin', 'moderator']), 
  announcementController.updateAnnouncement
);

// Delete announcement (Admin only)
router.delete('/:id', 
  requireRole(['admin']), 
  announcementController.deleteAnnouncement
);

// Publish/Unpublish announcement (Admin/Moderator only)
router.patch('/:id/publish', 
  requireRole(['admin', 'moderator']), 
  announcementController.togglePublish
);

// Pin/Unpin announcement (Admin/Moderator only)
router.patch('/:id/pin', 
  requireRole(['admin', 'moderator']), 
  announcementController.togglePin
);

module.exports = router;
