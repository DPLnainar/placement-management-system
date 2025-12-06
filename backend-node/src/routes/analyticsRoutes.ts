import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireRole } from '@middleware/auth';
import {
  getCollegePlacementStats,
  getJobEligibilityViolations,
  getCollegeWeeklySummary,
  requestExport,
  getExportStatus,
  downloadExport,
  triggerCollegeReport,
  getSchedulersStatus,
  triggerAllWeeklyReports,
  triggerManualCleanup
} from '@controllers/analyticsController';

const router = Router();

/**
 * Rate limiter for analytics endpoints
 * More restrictive for export endpoints
 */
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many analytics requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: 'Too many export requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const reportTriggerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 manual report triggers per hour
  message: 'Too many report trigger requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Analytics Routes
 * All routes require authentication
 * Access is scoped to college for admins, global for superadmins
 */

// Apply authentication to all routes
router.use(authenticate);

// Statistics endpoints
router.get(
  '/:collegeId/stats',
  analyticsLimiter,
  requireRole(['admin', 'superadmin', 'moderator']),
  getCollegePlacementStats
);

router.get(
  '/:collegeId/eligibility-violations/:jobId',
  analyticsLimiter,
  requireRole(['admin', 'superadmin', 'moderator']),
  getJobEligibilityViolations
);

router.get(
  '/:collegeId/weekly-summary',
  analyticsLimiter,
  requireRole(['admin', 'superadmin']),
  getCollegeWeeklySummary
);

// Export endpoints
router.get(
  '/:collegeId/export',
  exportLimiter,
  requireRole(['admin', 'superadmin']),
  requestExport
);

router.get(
  '/export-status/:jobId',
  analyticsLimiter,
  getExportStatus
);

router.get(
  '/download/:fileName',
  analyticsLimiter,
  downloadExport
);

// Report triggering
router.post(
  '/:collegeId/send-report',
  reportTriggerLimiter,
  requireRole(['admin', 'superadmin']),
  triggerCollegeReport
);

// Scheduler management (superadmin only)
router.get(
  '/scheduler/status',
  requireRole(['superadmin']),
  getSchedulersStatus
);

router.post(
  '/scheduler/trigger-weekly',
  reportTriggerLimiter,
  requireRole(['superadmin']),
  triggerAllWeeklyReports
);

router.post(
  '/scheduler/trigger-cleanup',
  reportTriggerLimiter,
  requireRole(['superadmin']),
  triggerManualCleanup
);

export default router;
