import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Statistics Routes
 * Temporarily disabled until statisticsController is migrated
 */

// router.use(authenticate);

// Get various statistics
// router.get('/overview', requireRole(['admin', 'moderator']), getOverviewStats);
// router.get('/placements', requireRole(['admin', 'moderator']), getPlacementStats);
// router.get('/students', requireRole(['admin', 'moderator']), getStudentStats);
// router.get('/jobs', requireRole(['admin', 'moderator']), getJobStats);

export default router;
