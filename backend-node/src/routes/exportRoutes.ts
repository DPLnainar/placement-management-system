import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Export Routes
 * Data export functionality (CSV, Excel)
 * Temporarily disabled until exportController is migrated
 */

// router.use(authenticate);
// router.use(requireRole(['admin', 'moderator']));

// Export endpoints
// router.get('/students', exportStudents);
// router.get('/applications', exportApplications);
// router.get('/placements', exportPlacements);

export default router;
