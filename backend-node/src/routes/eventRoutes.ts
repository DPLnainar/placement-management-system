import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Event Routes
 * Temporarily disabled until eventController is migrated
 */

// router.use(authenticate);

// Admin/Moderator: Manage events
// router.post('/', requireRole(['admin', 'moderator']), createEvent);
// router.get('/', getEvents);
// router.get('/:id', getEventById);
// router.put('/:id', requireRole(['admin', 'moderator']), updateEvent);
// router.delete('/:id', requireRole(['admin']), deleteEvent);

// Student: Register for events
// router.post('/:id/register', requireRole(['student']), registerForEvent);

export default router;
