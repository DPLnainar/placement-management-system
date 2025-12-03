import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Eligibility Routes
 * Temporarily disabled until eligibilityController is migrated
 */

// router.use(authenticate);

// Check eligibility for a specific job
// router.get('/job/:jobId', checkJobEligibility);

// Get student eligibility status
// router.get('/student/:studentId', getStudentEligibility);

export default router;
