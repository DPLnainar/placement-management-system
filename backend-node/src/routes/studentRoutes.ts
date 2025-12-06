import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as studentController from '../controllers/studentController';
import { uploadPhoto, uploadResume } from '../config/uploadConfig';

const router = Router();

/**
 * Student Routes
 */

router.use(authenticate);

// Profile
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);

// Uploads
router.post('/photo', uploadPhoto.single('photo'), studentController.uploadPhoto);
router.post('/resume/upload', uploadResume.single('resume'), studentController.uploadResume);

// Resume Generation
router.post('/resume/generate', studentController.generateResume);

// Jobs & Applications
router.get('/jobs/eligible', studentController.getEligibleJobs);
router.get('/applications', studentController.getApplications);

// Placement Card
router.get('/placement-card', studentController.getPlacementCard);

// Notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);
router.put('/notifications/read-all', studentController.markAllNotificationsRead);

// Profile Deletion Request
router.post('/profile-deletion-request', studentController.requestProfileDeletion);

export default router;
