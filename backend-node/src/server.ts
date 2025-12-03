import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from '@config/database';

// Import middleware
import logger from '@middleware/logger';
import { sanitizeInput } from '@middleware/validation';
import { auditMiddleware } from '@middleware/audit';
import { generalLimiter, authLimiter, passwordResetLimiter } from '@middleware/rateLimiter';

// Import routes
import authRoutes from '@routes/authRoutes';
import userRoutes from '@routes/userRoutes';
import jobRoutes from '@routes/jobRoutes';
import applicationRoutes from '@routes/applicationRoutes';
import studentRoutes from '@routes/studentRoutes';
import superAdminRoutes from '@routes/superAdminRoutes';
import eligibilityRoutes from '@routes/eligibilityRoutes';
import placementDriveRoutes from '@routes/placementDriveRoutes';
import invitationRoutes from '@routes/invitationRoutes';
import publicRoutes from '@routes/publicRoutes';
import uploadRoutes from '@routes/uploadRoutes';
import statisticsRoutes from '@routes/statisticsRoutes';
import announcementRoutes from '@routes/announcementRoutes';
import eventRoutes from '@routes/eventRoutes';
import auditRoutes from '@routes/auditRoutes';
import workflowRoutes from '@routes/workflowRoutes';
import companyRoutes from '@routes/companyRoutes';
import searchRoutes from '@routes/searchRoutes';
import exportRoutes from '@routes/exportRoutes';

const app: Express = express();
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

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Development logging
if (process.env.NODE_ENV !== 'production') {
  app.use(logger);
}

// Audit middleware
app.use(auditMiddleware);

// Rate limiting
app.use('/api/', generalLimiter);

// ==========================================
// ROUTES SETUP
// ==========================================

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
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
    },
  });
});

// Rate limit specific endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/placement-drives', placementDriveRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('\n❌ ERROR:', err.message);

  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack:', err.stack);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
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

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

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
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
};

// Start the server
void startServer();

export default app;
