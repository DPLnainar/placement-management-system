const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');

/**
 * Student Routes
 * 
 * Public routes:
 * - POST /register - Student self-registration (must select college)
 * 
 * Protected routes (requires authentication):
 * - GET /profile - Get own profile with student data
 * - PUT /profile - Update own profile
 */

// Public route - Student self-registration
router.post('/register', studentController.registerStudent);

// Protected routes - Require authentication
router.get('/profile', authenticate, studentController.getStudentProfile);
router.put('/profile', authenticate, studentController.updateStudentProfile);

module.exports = router;
