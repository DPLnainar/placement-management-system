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

// Enhanced Profile Management Routes (Student only)
router.put('/education', authenticate, requireRole(['student']), studentController.updateEducation);
router.put('/skills', authenticate, requireRole(['student']), studentController.updateSkills);
router.post('/projects', authenticate, requireRole(['student']), studentController.addProject);
router.put('/projects/:projectId', authenticate, requireRole(['student']), studentController.updateProject);
router.delete('/projects/:projectId', authenticate, requireRole(['student']), studentController.deleteProject);
router.post('/experience', authenticate, requireRole(['student']), studentController.addExperience);
router.post('/certifications', authenticate, requireRole(['student']), studentController.addCertification);
router.post('/achievements', authenticate, requireRole(['student']), studentController.addAchievement);
router.put('/social-profiles', authenticate, requireRole(['student']), studentController.updateSocialProfiles);
router.put('/coding-stats', authenticate, requireRole(['student']), studentController.updateCodingStats);
router.get('/profile-strength', authenticate, requireRole(['student']), studentController.getProfileStrength);

module.exports = router;
