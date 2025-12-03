import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * SuperAdmin Routes
 * All routes require SuperAdmin authentication
 * Temporarily disabled until superAdminController is migrated
 */

// router.use(authenticate);
// router.use(requireRole(['superadmin']));

// College management
// router.post('/colleges', createCollege);
// router.get('/colleges', getAllColleges);
// router.put('/colleges/:id', updateCollege);
// router.delete('/colleges/:id', deleteCollege);

// Admin management
// router.post('/admins', createCollegeAdmin);
// router.get('/admins', getAllAdmins);

// System statistics
// router.get('/stats', getSystemStats);

export default router;
