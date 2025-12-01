const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const authController = require('../controllers/authController');

// Public route - no authentication required
// Get list of active colleges
router.get('/colleges', authController.getPublicColleges);
// Verify invitation token and get invitation details
router.get('/verify/:token', invitationController.verifyInvitation);

module.exports = router;
