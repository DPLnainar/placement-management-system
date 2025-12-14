import express from 'express';
import * as adminController from '../controllers/adminController';
import { protect, requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(requireRole(['admin']));

/**
 * Dashboard Routes
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * Moderator Management Routes
 */
router.get('/moderators', adminController.getModerators);
router.post('/moderators', adminController.createModerator);
router.put('/moderators/:id', adminController.updateModerator);
router.patch('/moderators/:id/status', adminController.toggleModeratorStatus);

/**
 * Job Notification Routes
 */
router.post('/jobs/:jobId/notify', adminController.notifyStudentsForJob);

/**
 * Job Management Routes
 */
router.post('/jobs', adminController.createJob);
router.put('/jobs/:id', adminController.updateJob);
router.patch('/jobs/:id/status', adminController.toggleJobStatus);

export default router;
