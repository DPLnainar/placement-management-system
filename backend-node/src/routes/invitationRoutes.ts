import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Invitation Routes
 * Temporarily disabled until invitationController is migrated
 */

// router.use(authenticate);

// Admin: Create and manage invitations
// router.post('/', requireRole(['admin']), createInvitation);
// router.get('/', requireRole(['admin', 'moderator']), getInvitations);
// router.delete('/:id', requireRole(['admin']), deleteInvitation);

export default router;
