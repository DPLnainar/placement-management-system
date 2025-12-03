import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Audit Routes
 * Temporarily disabled until auditController is migrated
 */

// router.use(authenticate);
// router.use(requireRole(['admin', 'superadmin']));

// Get audit logs
// router.get('/', getAuditLogs);
// router.get('/user/:userId', getUserAuditLogs);
// router.get('/suspicious', getSuspiciousActivity);

export default router;
