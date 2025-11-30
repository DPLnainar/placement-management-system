/**
 * Job Scheduler
 * 
 * Automated tasks for job management:
 * - Auto-close expired jobs
 * - Send deadline reminders
 * - Update job status based on application counts
 */

const Job = require('../models/Job');
const { sendEmail } = require('./notificationService');

/**
 * Auto-close jobs that have passed their deadline
 */
async function autoCloseExpiredJobs() {
  try {
    const now = new Date();

    // Find all expired active jobs
    const expiredJobs = await Job.find({
      deadline: { $lt: now },
      status: 'active'
    });

    if (expiredJobs.length === 0) {
      console.log('✓ No expired jobs to close');
      return { success: true, closedCount: 0 };
    }

    // Close expired jobs
    const result = await Job.updateMany(
      {
        deadline: { $lt: now },
        status: 'active'
      },
      {
        $set: { status: 'closed' }
      }
    );

    console.log(`✓ Auto-closed ${result.modifiedCount} expired jobs`);
    return { success: true, closedCount: result.modifiedCount };

  } catch (error) {
    console.error('❌ Error auto-closing expired jobs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Close jobs that have reached max application limit
 */
async function autoCloseFullJobs() {
  try {
    const result = await Job.updateMany(
      {
        status: 'active',
        maxApplications: { $ne: null },
        $expr: { $gte: ['$currentApplicationCount', '$maxApplications'] }
      },
      {
        $set: { status: 'closed' }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✓ Auto-closed ${result.modifiedCount} jobs that reached application limit`);
    }

    return { success: true, closedCount: result.modifiedCount };

  } catch (error) {
    console.error('❌ Error auto-closing full jobs:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send deadline reminders for jobs closing soon
 * (Jobs closing within 24 hours)
 */
async function sendDeadlineReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const closingSoonJobs = await Job.find({
      status: 'active',
      deadline: {
        $gte: new Date(),
        $lte: tomorrow
      },
      notificationsSent: false
    }).populate('collegeId', 'name');

    console.log(`✓ Found ${closingSoonJobs.length} jobs closing within 24 hours`);

    // Mark notifications as sent
    for (const job of closingSoonJobs) {
      job.notificationsSent = true;
      await job.save();
      
      // Here you can implement actual notification sending logic
      // For example: send email to all eligible students
      console.log(`  - Reminder sent for: ${job.title} at ${job.collegeId?.name || 'Unknown College'}`);
    }

    return { success: true, notificationsSent: closingSoonJobs.length };

  } catch (error) {
    console.error('❌ Error sending deadline reminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get jobs statistics summary
 */
async function getJobsStatisticsSummary() {
  try {
    const total = await Job.countDocuments();
    const active = await Job.countDocuments({ status: 'active' });
    const closed = await Job.countDocuments({ status: 'closed' });
    const draft = await Job.countDocuments({ status: 'draft' });
    
    const now = new Date();
    const expired = await Job.countDocuments({
      status: 'active',
      deadline: { $lt: now }
    });

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const closingSoon = await Job.countDocuments({
      status: 'active',
      deadline: { $gte: now, $lte: threeDaysFromNow }
    });

    return {
      total,
      active,
      closed,
      draft,
      expired,
      closingSoon
    };

  } catch (error) {
    console.error('❌ Error getting jobs statistics:', error);
    return null;
  }
}

/**
 * Run all scheduled tasks
 */
async function runScheduledTasks() {
  console.log('\n🕒 Running scheduled job tasks...');
  console.log('Time:', new Date().toLocaleString());
  
  const stats = await getJobsStatisticsSummary();
  if (stats) {
    console.log('\n📊 Current Job Statistics:');
    console.log(`   Total Jobs: ${stats.total}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Closed: ${stats.closed}`);
    console.log(`   Draft: ${stats.draft}`);
    console.log(`   Expired (need closing): ${stats.expired}`);
    console.log(`   Closing Soon (3 days): ${stats.closingSoon}`);
  }

  console.log('\n🔄 Running maintenance tasks...');
  
  // Close expired jobs
  await autoCloseExpiredJobs();
  
  // Close jobs at max capacity
  await autoCloseFullJobs();
  
  // Send deadline reminders
  // await sendDeadlineReminders(); // Uncomment when email notifications are ready
  
  console.log('✅ Scheduled tasks completed\n');
}

/**
 * Start the scheduler (runs every 1 hour)
 */
function startScheduler() {
  // Run immediately on start
  runScheduledTasks();
  
  // Then run every hour
  const HOUR_IN_MS = 60 * 60 * 1000;
  setInterval(runScheduledTasks, HOUR_IN_MS);
  
  console.log('✓ Job scheduler started (runs every hour)');
}

module.exports = {
  autoCloseExpiredJobs,
  autoCloseFullJobs,
  sendDeadlineReminders,
  getJobsStatisticsSummary,
  runScheduledTasks,
  startScheduler
};
