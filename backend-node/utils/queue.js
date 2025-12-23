const { Queue } = require('bullmq');

/**
 * Job Notification Queue
 * Handles background email sending for new jobs
 */
const notificationQueue = new Queue('notificationQueue', {
    connection: {
        url: process.env.REDIS_URI || 'redis://localhost:6379'
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
    },
});

notificationQueue.on('error', (err) => {
    console.error('Queue Error:', err);
});

module.exports = {
    notificationQueue
};
