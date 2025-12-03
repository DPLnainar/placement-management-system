import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Student Routes
 * Temporarily disabled until studentController is migrated
 * 
 * Public routes:
 * - POST /register - Student self-registration
 * 
 * Protected routes:
 * - GET /profile - Get own profile with student data
 * - PUT /profile - Update own profile
 * - Enhanced profile management endpoints
 */

// Public route - Student self-registration
// router.post('/register', registerStudent);

// Protected routes
// router.get('/profile', authenticate, getStudentProfile);
// router.put('/profile', authenticate, updateStudentProfile);
// router.put('/:userId/profile', authenticate, requireRole(['admin', 'moderator']), updateStudentProfile);

// Enhanced Profile Management Routes
// router.put('/education', authenticate, requireRole(['student']), updateEducation);
// router.put('/skills', authenticate, requireRole(['student']), updateSkills);
// router.post('/projects', authenticate, requireRole(['student']), addProject);
// router.put('/projects/:projectId', authenticate, requireRole(['student']), updateProject);
// router.delete('/projects/:projectId', authenticate, requireRole(['student']), deleteProject);
// router.post('/experience', authenticate, requireRole(['student']), addExperience);
// router.post('/certifications', authenticate, requireRole(['student']), addCertification);
// router.post('/achievements', authenticate, requireRole(['student']), addAchievement);
// router.put('/social-profiles', authenticate, requireRole(['student']), updateSocialProfiles);
// router.put('/coding-stats', authenticate, requireRole(['student']), updateCodingStats);
// router.get('/profile-strength', authenticate, requireRole(['student']), getProfileStrength);

export default router;
