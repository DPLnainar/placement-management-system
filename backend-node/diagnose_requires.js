
const modules = [
    './config/database',
    './middleware/logger',
    './middleware/validation',
    './middleware/audit',
    './middleware/rateLimiter',
    './routes/authRoutes',
    './routes/userRoutes',
    './routes/jobRoutes',
    './routes/applicationRoutes',
    './routes/studentRoutes',
    './routes/superAdminRoutes',
    './routes/eligibilityRoutes',
    './routes/placementDriveRoutes',
    './routes/invitationRoutes',
    './routes/publicRoutes',
    './routes/uploadRoutes',
    './routes/statisticsRoutes',
    './routes/announcementRoutes',
    './routes/eventRoutes',
    './routes/auditRoutes',
    './routes/workflowRoutes',
    './routes/companyRoutes',
    './routes/searchRoutes',
    './routes/exportRoutes',
    './workers/emailWorker' // This is required on line 71
];

console.log('Checking dependencies...');

modules.forEach(m => {
    try {
        require(m);
        console.log(`✅ Loaded ${m}`);
    } catch (e) {
        console.log(`❌ FAILED to load ${m}`);
        console.log(`   Error: ${e.message}`);
    }
});

console.log('Done checking.');
