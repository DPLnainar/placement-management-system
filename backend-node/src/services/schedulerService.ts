import cron from 'node-cron';
import { sendWeeklyReport } from './emailService';
import { cleanupOldExports } from './exportService';
import College from '@models/College';
import User from '@models/User';

/**
 * Scheduler Service
 * Manages scheduled jobs for analytics reports and file cleanup
 */

interface ScheduledJob {
  name: string;
  schedule: string;
  task: any | null;
}

const scheduledJobs: Map<string, ScheduledJob> = new Map();

/**
 * Get recipients for weekly report for a college
 */
async function getReportRecipients(collegeId: string): Promise<string[]> {
  const recipients: string[] = [];

  // Get college admins
  const admins = await User.find({
    collegeId,
    role: 'admin',
    status: 'active',
    email: { $exists: true, $ne: null }
  }).select('email');

  recipients.push(...admins.map(a => a.email).filter(Boolean));

  // Get super admins if configured
  if (process.env.INCLUDE_SUPERADMINS_IN_REPORTS === 'true') {
    const superAdmins = await User.find({
      role: 'superadmin',
      status: 'active',
      email: { $exists: true, $ne: null }
    }).select('email');

    recipients.push(...superAdmins.map(sa => sa.email).filter(Boolean));
  }

  return [...new Set(recipients)]; // Remove duplicates
}

/**
 * Weekly report job for a specific college
 */
async function weeklyReportJob(collegeId: string, collegeName: string): Promise<void> {
  try {
    console.log(`\n📊 Starting weekly report generation for ${collegeName}...`);

    const recipients = await getReportRecipients(collegeId);

    if (recipients.length === 0) {
      console.log(`⚠️ No recipients found for ${collegeName}, skipping report`);
      return;
    }

    const format = (process.env.REPORT_FORMAT as 'csv' | 'xlsx') || 'xlsx';

    await sendWeeklyReport({
      collegeId,
      collegeName,
      recipients,
      format
    });

    console.log(`✅ Weekly report sent successfully for ${collegeName}`);
  } catch (error) {
    console.error(`❌ Error generating weekly report for ${collegeName}:`, error);
  }
}

/**
 * Weekly reports job for all colleges
 */
async function weeklyReportsJob(): Promise<void> {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📊 WEEKLY REPORTS JOB STARTED');
    console.log('='.repeat(60));

    const colleges = await College.find({
      status: 'active',
      subscriptionStatus: { $in: ['active', 'trial'] }
    }).select('_id name');

    console.log(`Found ${colleges.length} active college(s)`);

    for (const college of colleges) {
      await weeklyReportJob(college._id.toString(), college.name);

      // Add delay between colleges to avoid overloading
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('='.repeat(60));
    console.log('✅ WEEKLY REPORTS JOB COMPLETED');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error in weekly reports job:', error);
  }
}

/**
 * Cleanup old export files job
 */
async function cleanupJob(): Promise<void> {
  try {
    console.log('\n🧹 Starting cleanup of old export files...');

    const maxAgeDays = parseInt(process.env.EXPORT_RETENTION_DAYS || '7');
    const deletedCount = await cleanupOldExports(maxAgeDays);

    console.log(`✅ Cleanup complete: Deleted ${deletedCount} old file(s)`);
  } catch (error) {
    console.error('❌ Error in cleanup job:', error);
  }
}

/**
 * Start weekly reports scheduler
 */
export function startWeeklyReportsScheduler(): void {
  const schedule = process.env.WEEKLY_REPORT_CRON || '0 9 * * MON'; // Default: Every Monday at 9 AM

  if (scheduledJobs.has('weeklyReports')) {
    console.log('⚠️ Weekly reports scheduler already running');
    return;
  }

  // @ts-ignore
  const task = cron.schedule(schedule, weeklyReportsJob, {
    scheduled: true,
    timezone: process.env.TZ || 'Asia/Kolkata'
  } as any);

  scheduledJobs.set('weeklyReports', {
    name: 'Weekly Reports',
    schedule,
    task
  });

  console.log(`✅ Weekly reports scheduler started: ${schedule} (${process.env.TZ || 'Asia/Kolkata'})`);
}

/**
 * Start cleanup scheduler
 */
export function startCleanupScheduler(): void {
  const schedule = process.env.CLEANUP_CRON || '0 2 * * *'; // Default: Every day at 2 AM

  if (scheduledJobs.has('cleanup')) {
    console.log('⚠️ Cleanup scheduler already running');
    return;
  }

  // @ts-ignore
  const task = cron.schedule(schedule, cleanupJob, {
    scheduled: true,
    timezone: process.env.TZ || 'Asia/Kolkata'
  } as any);

  scheduledJobs.set('cleanup', {
    name: 'Export Files Cleanup',
    schedule,
    task
  });

  console.log(`✅ Cleanup scheduler started: ${schedule} (${process.env.TZ || 'Asia/Kolkata'})`);
}

/**
 * Start all schedulers
 */
export function startAllSchedulers(): void {
  console.log('\n' + '='.repeat(60));
  console.log('⏰ STARTING SCHEDULERS');
  console.log('='.repeat(60));

  // Check if scheduling is enabled
  if (process.env.ENABLE_SCHEDULED_REPORTS !== 'true') {
    console.log('⚠️ Scheduled reports disabled (ENABLE_SCHEDULED_REPORTS != true)');
    return;
  }

  startWeeklyReportsScheduler();
  startCleanupScheduler();

  console.log('='.repeat(60) + '\n');
}

/**
 * Stop a specific scheduler
 */
export function stopScheduler(name: string): boolean {
  const job = scheduledJobs.get(name);

  if (!job || !job.task) {
    return false;
  }

  job.task.stop();
  scheduledJobs.delete(name);
  console.log(`🛑 Stopped scheduler: ${job.name}`);

  return true;
}

/**
 * Stop all schedulers
 */
export function stopAllSchedulers(): void {
  console.log('\n🛑 Stopping all schedulers...');

  for (const [name, job] of scheduledJobs.entries()) {
    if (job.task) {
      job.task.stop();
      console.log(`   Stopped: ${job.name}`);
    }
  }

  scheduledJobs.clear();
  console.log('✅ All schedulers stopped\n');
}

/**
 * Get status of all schedulers
 */
export function getSchedulerStatus(): Array<{
  name: string;
  schedule: string;
  running: boolean;
}> {
  return Array.from(scheduledJobs.values()).map(job => ({
    name: job.name,
    schedule: job.schedule,
    running: job.task !== null
  }));
}

/**
 * Manually trigger weekly reports (for testing)
 */
export async function triggerWeeklyReportsNow(): Promise<void> {
  console.log('🔧 Manually triggering weekly reports job...');
  await weeklyReportsJob();
}

/**
 * Manually trigger cleanup (for testing)
 */
export async function triggerCleanupNow(): Promise<void> {
  console.log('🔧 Manually triggering cleanup job...');
  await cleanupJob();
}

/**
 * Send report to specific college immediately
 */
export async function sendCollegeReportNow(collegeId: string): Promise<void> {
  const college = await College.findById(collegeId);

  if (!college) {
    throw new Error('College not found');
  }

  await weeklyReportJob(collegeId, college.name);
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  console.log('\n📡 Received SIGINT, stopping schedulers...');
  stopAllSchedulers();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📡 Received SIGTERM, stopping schedulers...');
  stopAllSchedulers();
  process.exit(0);
});
