"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const database_1 = require("@config/database");
// Import middleware
const logger_1 = __importDefault(require("@middleware/logger"));
const validation_1 = require("@middleware/validation");
const audit_1 = require("@middleware/audit");
const rateLimiter_1 = require("@middleware/rateLimiter");
// Import routes
const authRoutes_1 = __importDefault(require("@routes/authRoutes"));
const userRoutes_1 = __importDefault(require("@routes/userRoutes"));
const jobRoutes_1 = __importDefault(require("@routes/jobRoutes"));
const applicationRoutes_1 = __importDefault(require("@routes/applicationRoutes"));
const studentRoutes_1 = __importDefault(require("@routes/studentRoutes"));
const superAdminRoutes_1 = __importDefault(require("@routes/superAdminRoutes"));
const eligibilityRoutes_1 = __importDefault(require("@routes/eligibilityRoutes"));
const placementDriveRoutes_1 = __importDefault(require("@routes/placementDriveRoutes"));
const invitationRoutes_1 = __importDefault(require("@routes/invitationRoutes"));
const publicRoutes_1 = __importDefault(require("@routes/publicRoutes"));
const uploadRoutes_1 = __importDefault(require("@routes/uploadRoutes"));
const statisticsRoutes_1 = __importDefault(require("@routes/statisticsRoutes"));
const announcementRoutes_1 = __importDefault(require("@routes/announcementRoutes"));
const eventRoutes_1 = __importDefault(require("@routes/eventRoutes"));
const auditRoutes_1 = __importDefault(require("@routes/auditRoutes"));
const workflowRoutes_1 = __importDefault(require("@routes/workflowRoutes"));
const companyRoutes_1 = __importDefault(require("@routes/companyRoutes"));
const searchRoutes_1 = __importDefault(require("@routes/searchRoutes"));
const exportRoutes_1 = __importDefault(require("@routes/exportRoutes"));
const analyticsRoutes_1 = __importDefault(require("@routes/analyticsRoutes"));
const adminRoutes_1 = __importDefault(require("@routes/adminRoutes"));
const adminModeratorRoutes_1 = __importDefault(require("@routes/adminModeratorRoutes"));
const moderatorRoutes_1 = __importDefault(require("@routes/moderatorRoutes"));
const verificationRoutes_1 = __importDefault(require("@routes/verificationRoutes"));
// Import scheduler service
const schedulerService_1 = require("@services/schedulerService");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
/**
 * College Placement Management System - TypeScript Version
 * Node.js + Express + MongoDB
 *
 * ARCHITECTURE OVERVIEW
 * ====================
 *
 * Role-based authentication with college isolation
 * - Admin: Full control over assigned college
 * - Moderator: Limited management, data viewing
 * - Student: Job viewing and application
 * - SuperAdmin: Cross-college administration
 */
// ==========================================
// MIDDLEWARE SETUP
// ==========================================
// Security headers (Helmet.js)
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
// Gzip compression for responses
app.use((0, compression_1.default)());
// Request logging
app.use((req, _res, next) => {
    console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Cookie parser for handling httpOnly cookies
app.use((0, cookie_parser_1.default)());
// Body parser
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Input sanitization
app.use(validation_1.sanitizeInput);
// Development logging
if (process.env.NODE_ENV !== 'production') {
    app.use(logger_1.default);
}
// Audit middleware
app.use(audit_1.auditMiddleware);
// Rate limiting
app.use('/api/', rateLimiter_1.generalLimiter);
// ==========================================
// ROUTES SETUP
// ==========================================
// Health check endpoint
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'College Placement Management API',
        version: '2.0.0-ts',
        environment: process.env.NODE_ENV,
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            jobs: '/api/jobs',
            applications: '/api/applications',
            eligibility: '/api/eligibility',
            s3: '/api/s3',
        },
    });
});
// Rate limit specific endpoints
// app.use('/api/auth/login', authLimiter); // Disabled for debugging
app.use('/api/auth/forgot-password', rateLimiter_1.passwordResetLimiter);
app.use('/api/auth/reset-password', rateLimiter_1.passwordResetLimiter);
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/jobs', jobRoutes_1.default);
app.use('/api/applications', applicationRoutes_1.default);
app.use('/api/students', studentRoutes_1.default);
app.use('/api/superadmin', superAdminRoutes_1.default);
app.use('/api/eligibility', eligibilityRoutes_1.default);
app.use('/api/placement-drives', placementDriveRoutes_1.default);
app.use('/api/invitations', invitationRoutes_1.default);
app.use('/api/public', publicRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/statistics', statisticsRoutes_1.default);
app.use('/api/announcements', announcementRoutes_1.default);
app.use('/api/events', eventRoutes_1.default);
app.use('/api/audit', auditRoutes_1.default);
app.use('/api/workflow', workflowRoutes_1.default);
app.use('/api/companies', companyRoutes_1.default);
app.use('/api/search', searchRoutes_1.default);
app.use('/api/export', exportRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/admin', adminModeratorRoutes_1.default);
app.use('/api/moderator', moderatorRoutes_1.default);
app.use('/api/moderator/verification', verificationRoutes_1.default);
// ==========================================
// ERROR HANDLING
// ==========================================
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: _req.path,
    });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error('\n❌ ERROR:', err.message);
    if (process.env.NODE_ENV !== 'production') {
        console.error('Stack:', err.stack);
    }
    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        res.status(400).json({
            success: false,
            message: `${field} already exists`,
        });
        return;
    }
    // MongoDB validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        res.status(400).json({
            success: false,
            message: 'Validation error',
            errors,
        });
        return;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Token expired',
        });
        return;
    }
    // Default error response
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});
// ==========================================
// SERVER STARTUP
// ==========================================
const startServer = async () => {
    try {
        // Connect to database
        await (0, database_1.connectDB)();
        // Start server
        app.listen(PORT, () => {
            console.log(`
============================================================
🚀 SERVER STARTED SUCCESSFULLY
============================================================
📍 Server running on: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📦 TypeScript enabled
============================================================
`);
            // Start schedulers after server is running
            (0, schedulerService_1.startAllSchedulers)();
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`✗ Failed to start server: ${errorMessage}`);
        process.exit(1);
    }
};
// Start the server
void startServer();
exports.default = app;
// Trigger restart 2
//# sourceMappingURL=server.js.map