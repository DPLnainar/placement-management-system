const { Worker } = require('bullmq');
const sendEmail = require('../utils/sendEmail');
const StudentData = require('../models/StudentData');
const User = require('../models/User');

/**
 * Email Worker
 * Processes jobs from the 'notificationQueue'
 */

const connection = {
    url: process.env.REDIS_URI || 'redis://localhost:6379'
};

const worker = new Worker('notificationQueue', async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);

    if (job.name === 'sendJobAlert') {
        const { jobId, jobTitle, company, collegeId } = job.data;

        // Find eligible students (simplified for now: all active students in college)
        // In production, this would use the complex matching logic
        const students = await User.find({
            collegeId: collegeId,
            role: 'student',
            status: 'active'
        }).select('email fullName');

        console.log(`Sending job alert for ${jobTitle} to ${students.length} students...`);

        // Send in batches to avoid rate limits
        // Note: sendEmail utility needs to support single email sending
        let successCount = 0;

        for (const student of students) {
            try {
                await sendEmail({
                    email: student.email,
                    subject: `New Job Opportunity: ${jobTitle} at ${company}`,
                    message: `Hello ${student.fullName},\n\nA new job has been posted: ${jobTitle} at ${company}.\n\nLog in to apply now!`
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to email ${student.email}:`, err.message);
            }
        }

        return { sent: successCount, total: students.length };
    }
}, { connection });

worker.on('completed', (job, returnvalue) => {
    console.log(`Job ${job.id} completed! Sent ${returnvalue.sent}/${returnvalue.total} emails.`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
});

module.exports = worker;
