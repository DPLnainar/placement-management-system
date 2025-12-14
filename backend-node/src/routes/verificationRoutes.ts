import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
    getVerificationQueue,
    getQueueCount,
    getVerificationDetails,
    approveVerification,
    rejectVerification
} from '../controllers/verificationController';

const router = Router();

// Apply auth to all routes
router.use(requireAuth);
// Only moderators can access these routes
router.use(requireRole(['moderator']));

// Verification queue routes
router.get('/queue', getVerificationQueue);
router.get('/queue/count', getQueueCount);
router.get('/:studentId/details', getVerificationDetails);
router.post('/:studentId/approve', approveVerification);
router.post('/:studentId/reject', rejectVerification);

export default router;
