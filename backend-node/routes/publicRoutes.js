const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

// Public route - no authentication required
// Verify invitation token and get invitation details
router.get('/verify/:token', invitationController.verifyInvitation);

module.exports = router;
