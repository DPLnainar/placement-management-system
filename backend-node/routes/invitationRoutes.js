const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes require authentication as moderator or admin
router.use(authenticate);
router.use(requireRole(['admin', 'moderator']));

// Create single invitation
router.post('/', invitationController.createInvitation);

// Create bulk invitations
router.post('/bulk', invitationController.createBulkInvitations);

// Get all invitations for the college
router.get('/', invitationController.getInvitations);

// Resend invitation email
router.post('/:id/resend', invitationController.resendInvitation);

// Cancel invitation
router.delete('/:id', invitationController.cancelInvitation);

module.exports = router;
