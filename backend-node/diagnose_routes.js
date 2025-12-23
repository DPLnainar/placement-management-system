const fs = require('fs');
const modules = [
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
    './routes/exportRoutes'
];

const fd = fs.openSync('routes_status.txt', 'w');

modules.forEach(m => {
    try {
        require(m);
        fs.writeSync(fd, `OK: ${m}\n`);
    } catch (e) {
        fs.writeSync(fd, `FAIL: ${m} - ${e.message}\n`);
    }
});

fs.closeSync(fd);
console.log('Routes check complete.');
