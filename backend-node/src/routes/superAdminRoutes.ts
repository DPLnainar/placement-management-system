import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as superAdminController from '../controllers/superAdminController';

const router = Router();

/**
 * SuperAdmin Routes
 * All routes require SuperAdmin authentication
 */

router.use(authenticate);
router.use(requireRole(['superadmin']));

// College management
// @ts-ignore
router.post('/colleges', superAdminController.createCollegeWithAdmin);
// @ts-ignore
router.get('/colleges', superAdminController.getAllColleges);
// @ts-ignore
router.put('/colleges/:id', superAdminController.updateCollege);
// @ts-ignore
router.delete('/colleges/:id', superAdminController.deleteCollege);

// Admin management
// router.post('/admins', createCollegeAdmin); // This seems to be handled by createCollegeWithAdmin or separate logic?
// router.get('/admins', getAllAdmins);

// System statistics
// @ts-ignore
router.get('/dashboard-stats', superAdminController.getDashboardStats);
// @ts-ignore
router.get('/placement-data', superAdminController.getAllPlacementData);
// @ts-ignore
router.post('/bulk-upload-email', superAdminController.sendBulkUploadEmail);

// Student Placement Management
// @ts-ignore
router.put('/students/:id/accept-offer/:offerId', requireRole(['admin', 'moderator']), superAdminController.adminAcceptOfferForStudent);

export default router;
