import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '@/types';
import {
  getPlacementStats,
  getEligibilityViolations,
  getWeeklySummary
} from '@services/analyticsService';
import { generateExport, getExportFile } from '@services/exportService';
import {
  sendCollegeReportNow,
  triggerWeeklyReportsNow,
  triggerCleanupNow,
  getSchedulerStatus
} from '@services/schedulerService';

/**
 * Get placement statistics for a college
 * GET /api/analytics/:collegeId/stats
 */
export async function getCollegePlacementStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req as IAuthRequest;
    const { collegeId } = req.params;
    const { fromDate, toDate } = req.query;

    // Security: Check user access
    if (request.user?.role !== 'superadmin') {
      if (request.user?.collegeId?.toString() !== collegeId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this college data'
        });
        return;
      }
    }

    const dateOptions: any = {};
    if (fromDate) dateOptions.fromDate = new Date(fromDate as string);
    if (toDate) dateOptions.toDate = new Date(toDate as string);

    const stats = await getPlacementStats(collegeId, dateOptions);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get eligibility violations for a job
 * GET /api/analytics/:collegeId/eligibility-violations/:jobId
 */
export async function getJobEligibilityViolations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req as IAuthRequest;
    const { collegeId, jobId } = req.params;

    // Security: Check user access
    if (request.user?.role !== 'superadmin') {
      if (request.user?.collegeId?.toString() !== collegeId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this college data'
        });
        return;
      }
    }

    const violations = await getEligibilityViolations(collegeId, jobId);

    res.json({
      success: true,
      data: violations
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get weekly summary with trends
 * GET /api/analytics/:collegeId/weekly-summary
 */
export async function getCollegeWeeklySummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req as IAuthRequest;
    const { collegeId } = req.params;

    // Security: Check user access
    if (request.user?.role !== 'superadmin') {
      if (request.user?.collegeId?.toString() !== collegeId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this college data'
        });
        return;
      }
    }

    const summary = await getWeeklySummary(collegeId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

// Store for pending export jobs (in-memory - for production use Redis)
const exportJobs = new Map<string, { status: 'pending' | 'completed' | 'failed'; filePath?: string; error?: string }>();

/**
 * Request data export
 * GET /api/analytics/:collegeId/export
 * Query params: from, to, format (csv|xlsx), type (placement|jobs|applications)
 */
export async function requestExport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req as IAuthRequest;
    const { collegeId } = req.params;
    const { from, to, format = 'xlsx', type = 'placement' } = req.query;

    // Security: Check user access
    if (request.user?.role !== 'superadmin') {
      if (request.user?.collegeId?.toString() !== collegeId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this college data'
        });
        return;
      }
    }

    // Validate format
    if (!['csv', 'xlsx'].includes(format as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Must be csv or xlsx'
      });
      return;
    }

    // Validate type
    if (!['placement', 'jobs', 'applications'].includes(type as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Must be placement, jobs, or applications'
      });
      return;
    }

    const dateOptions: any = {
      collegeId,
      format: format as 'csv' | 'xlsx',
      type: type as 'placement' | 'jobs' | 'applications'
    };

    if (from) dateOptions.fromDate = new Date(from as string);
    if (to) dateOptions.toDate = new Date(to as string);

    // Check if export should be queued (for large datasets)
    const shouldQueue = false; // Simplified - can add logic based on date range

    if (shouldQueue) {
      // Queue the export job
      const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      exportJobs.set(jobId, { status: 'pending' });

      // Process asynchronously
      generateExport(dateOptions)
        .then(result => {
          exportJobs.set(jobId, { status: 'completed', filePath: result.fileName });
        })
        .catch(error => {
          exportJobs.set(jobId, { status: 'failed', error: error.message });
        });

      res.status(202).json({
        success: true,
        message: 'Export job queued',
        jobId,
        statusUrl: `/api/analytics/export-status/${jobId}`
      });
    } else {
      // Generate export immediately
      const result = await generateExport(dateOptions);

      // Send file directly
      res.download(result.filePath, result.fileName, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get export job status
 * GET /api/analytics/export-status/:jobId
 */
export async function getExportStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { jobId } = req.params;

    const job = exportJobs.get(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Export job not found'
      });
      return;
    }

    if (job.status === 'completed' && job.filePath) {
      res.json({
        success: true,
        status: 'completed',
        downloadUrl: `/api/analytics/download/${job.filePath}`
      });
    } else if (job.status === 'failed') {
      res.json({
        success: false,
        status: 'failed',
        error: job.error
      });
    } else {
      res.json({
        success: true,
        status: 'pending'
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Download export file
 * GET /api/analytics/download/:fileName
 */
export async function downloadExport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fileName } = req.params;

    const filePath = await getExportFile(fileName);

    if (!filePath) {
      res.status(404).json({
        success: false,
        message: 'File not found or expired'
      });
      return;
    }

    res.download(filePath, fileName);
  } catch (error) {
    next(error);
  }
}

/**
 * Trigger weekly report for a college (admin action)
 * POST /api/analytics/:collegeId/send-report
 */
export async function triggerCollegeReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req as IAuthRequest;
    const { collegeId } = req.params;

    // Security: Only admin and superadmin can trigger reports
    if (!['admin', 'superadmin'].includes(request.user?.role || '')) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    // Admin can only trigger for their college
    if (request.user?.role === 'admin' && request.user?.collegeId?.toString() !== collegeId) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this college'
      });
      return;
    }

    await sendCollegeReportNow(collegeId);

    res.json({
      success: true,
      message: 'Weekly report sent successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get scheduler status (superadmin only)
 * GET /api/analytics/scheduler/status
 */
export async function getSchedulersStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req as IAuthRequest;

    // Security: Superadmin only
    if (request.user?.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Superadmin access required'
      });
      return;
    }

    const status = getSchedulerStatus();

    res.json({
      success: true,
      data: {
        schedulers: status,
        environment: {
          enabled: process.env.ENABLE_SCHEDULED_REPORTS === 'true',
          weeklyReportCron: process.env.WEEKLY_REPORT_CRON || '0 9 * * MON',
          cleanupCron: process.env.CLEANUP_CRON || '0 2 * * *',
          timezone: process.env.TZ || 'Asia/Kolkata',
          retentionDays: process.env.EXPORT_RETENTION_DAYS || '7'
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Manually trigger all weekly reports (superadmin only)
 * POST /api/analytics/scheduler/trigger-weekly
 */
export async function triggerAllWeeklyReports(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req as IAuthRequest;

    // Security: Superadmin only
    if (request.user?.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Superadmin access required'
      });
      return;
    }

    // Trigger asynchronously
    triggerWeeklyReportsNow().catch(err => {
      console.error('Error in manual weekly reports trigger:', err);
    });

    res.json({
      success: true,
      message: 'Weekly reports job triggered'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Manually trigger cleanup (superadmin only)
 * POST /api/analytics/scheduler/trigger-cleanup
 */
export async function triggerManualCleanup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = req as IAuthRequest;

    // Security: Superadmin only
    if (request.user?.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Superadmin access required'
      });
      return;
    }

    // Trigger asynchronously
    triggerCleanupNow().catch(err => {
      console.error('Error in manual cleanup trigger:', err);
    });

    res.json({
      success: true,
      message: 'Cleanup job triggered'
    });
  } catch (error) {
    next(error);
  }
}
