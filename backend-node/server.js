require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import middleware
const logger = require('./middleware/logger');
const { sanitizeInput } = require('./middleware/validation');
const { auditMiddleware } = require('./middleware/audit');
const { generalLimiter, authLimiter, passwordResetLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const studentRoutes = require('./routes/studentRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const eligibilityRoutes = require('./routes/eligibilityRoutes');
const placementDriveRoutes = require('./routes/placementDriveRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const publicRoutes = require('./routes/publicRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const eventRoutes = require('./routes/eventRoutes');
const auditRoutes = require('./routes/auditRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const companyRoutes = require('./routes/companyRoutes');
const searchRoutes = require('./routes/searchRoutes');
const exportRoutes = require('./routes/exportRoutes');

/**
 * College Placement Management System
 * Node.js + Express + MongoDB
 * 
 * ROLE-BASED AUTHENTICATION SYSTEM
 * 
 * Architecture Overview:
 * ====================
 * 
 * 1. COLLEGE ASSIGNMENT HIERARCHY:
 *    - Developers manually create admin users and assign them to colleges in the database
 *    - Admins log in and are auto-linked to their pre-assigned college
 *    - Admins create moderators and students for their college only
 *    - All users are permanently associated with one college
 * 
 * 2. NO COLLEGE SELECTION DURING LOGIN:
 *    - Users provide only username/email and password
 *    - System automatically links them to their assigned college
 *    - College association is verified on every request via middleware
 * 
 * 3. ROLE-BASED ACCESS CONTROL:
 *    - Admin: Full control over their college (create/manage users, view all data)
 *    - Moderator: View users and data, limited management permissions
 *    - Student: View jobs and apply, cannot manage other users
 * 
 * 4. MIDDLEWARE PROTECTION:
 *    - authenticate: Verifies JWT token
 *    - requireRole: Checks user has required role
 *    - requireSameCollege: Ensures user only accesses their college's data
 *    - requireAdminForAssignment: Validates admin can only assign to their college
 * 
 * 5. DATA ISOLATION:
 *    - All queries filtered by collegeId
 *    - Cross-college access strictly prohibited
 *    - Middleware enforces college boundaries
 */

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

// Enable CORS for frontend (single port application)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Sanitize all inputs
app.use(sanitizeInput);

// Request logging (development mode)
if (process.env.NODE_ENV !== 'production') {
  app.use(logger);
}

// Audit logging middleware (all authenticated requests)
app.use(auditMiddleware);

// General rate limiting
app.use('/api/', generalLimiter);

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'College Placement Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      jobs: '/api/jobs'
    }
  });
});

// API Routes
app.use('/api/auth/login', authLimiter); // Rate limit login attempts
app.use('/api/auth/forgot-password', passwordResetLimiter); // Rate limit password resets
app.use('/api/auth/reset-password', passwordResetLimiter);
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
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('\n❌ ERROR:', err.message);

  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack:', err.stack);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 SERVER STARTED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.MONGODB_URI}`);
      console.log('\n📚 Available Endpoints:');
      console.log('   GET  /                         - API info');
      console.log('   POST /api/auth/login           - Login (no college selection)');
      console.log('   GET  /api/auth/profile         - Get user profile');
      console.log('   PUT  /api/auth/change-password - Change password');
      console.log('   POST /api/users                - Create user (admin only)');
      console.log('   GET  /api/users                - Get college users');
      console.log('   GET  /api/users/:id            - Get user by ID');
      console.log('   PUT  /api/users/:id/status     - Update user status');
      console.log('   DELETE /api/users/:id          - Delete user');
      console.log('   POST /api/jobs                 - Create job (admin/moderator)');
      console.log('   GET  /api/jobs                 - Get college jobs');
      console.log('   GET  /api/jobs/:id             - Get job by ID');
      console.log('   PUT  /api/jobs/:id             - Update job');
      console.log('   DELETE /api/jobs/:id           - Delete job');
      console.log('\n💡 Key Features:');
      console.log('   ✓ No college selection during login');
      console.log('   ✓ Auto-link users to pre-assigned college');
      console.log('   ✓ Role-based access control (admin/moderator/student)');
      console.log('   ✓ Admins can only manage their college');
      console.log('   ✓ JWT authentication with role and college in token');
      console.log('   ✓ Middleware enforces college boundaries');
      console.log('   ✓ Forgot password with email reset link');

      // Check email configuration
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD ||
        process.env.EMAIL_USER === 'your-email@gmail.com') {
        console.log('\n⚠️  EMAIL NOT CONFIGURED:');
        console.log('   To enable password reset emails:');
        console.log('   1. Edit backend-node/.env file');
        console.log('   2. Set EMAIL_USER=your-gmail@gmail.com');
        console.log('   3. Set EMAIL_PASSWORD=your-app-password');
        console.log('   📖 See EMAIL_SETUP.md for detailed instructions');
      } else {
        console.log('\n✅ Email configured: ' + process.env.EMAIL_USER);
      }

      console.log('\n🔧 Developer Commands:');
      console.log('   npm run seed  - Create sample admin users');
      console.log('   npm run dev   - Start with nodemon (auto-restart)');
      console.log('='.repeat(60) + '\n');

      // Start job scheduler for auto-closing expired jobs
      const { startScheduler } = require('./utils/jobScheduler');
      try {
        startScheduler();
      } catch (error) {
        console.error('❌ Error starting scheduler:', error);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
