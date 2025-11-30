const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * Student Routes
 * 
 * Public routes:
 * - POST /register - Student self-registration (must select college)
 * 
 * Protected routes (requires authentication):
 * - GET /profile - Get own profile with student data
 * - PUT /profile - Update own profile (restricted fields)
 * - PUT /:userId/profile - Moderator/Admin update student profile (all fields)
 */

// Public route - Student self-registration
router.post('/register', studentController.registerStudent);

// Protected routes - Require authentication
router.get('/profile', authenticate, studentController.getStudentProfile);
router.put('/profile', authenticate, studentController.updateStudentProfile);

// Moderator/Admin route - Update any student's profile
router.put('/:userId/profile', 
  authenticate, 
  requireRole(['admin', 'moderator']), 
  studentController.updateStudentProfile
);

module.exports = router;
