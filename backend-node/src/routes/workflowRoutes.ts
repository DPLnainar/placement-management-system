import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Workflow Routes
 * Temporarily disabled until workflowController is migrated
 */

// router.use(authenticate);

// Workflow management
// router.get('/status/:applicationId', getWorkflowStatus);
// router.post('/transition', requireRole(['admin', 'moderator']), transitionWorkflow);

export default router;
