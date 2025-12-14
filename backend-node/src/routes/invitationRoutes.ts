import { Router } from 'express';
import * as invitationController from '../controllers/invitationController';
import { protect, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(protect);

// Admin and Moderator: Get all invitations
router.get('/', requireRole(['admin', 'moderator']), invitationController.getInvitations);

// Admin and Moderator: Create single invitation
router.post('/', requireRole(['admin', 'moderator']), invitationController.createInvitation);

// Admin and Moderator: Create bulk invitations
router.post('/bulk', requireRole(['admin', 'moderator']), invitationController.createBulkInvitations);

// Admin and Moderator: Resend invitation
router.post('/:id/resend', requireRole(['admin', 'moderator']), invitationController.resendInvitation);

// Admin and Moderator: Cancel invitation
router.delete('/:id', requireRole(['admin', 'moderator']), invitationController.cancelInvitation);

export default router;
