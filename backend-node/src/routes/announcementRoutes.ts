import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Announcement Routes
 * Temporarily disabled until announcementController is migrated
 */

// router.use(authenticate);

// Admin/Moderator: Manage announcements
// router.post('/', requireRole(['admin', 'moderator']), createAnnouncement);
// router.get('/', getAnnouncements);
// router.get('/:id', getAnnouncementById);
// router.put('/:id', requireRole(['admin', 'moderator']), updateAnnouncement);
// router.delete('/:id', requireRole(['admin']), deleteAnnouncement);

export default router;
