const express = require('express');
const router = express.Router();
const { 
  authenticate, 
  requireRole 
} = require('../middleware/auth');
const {
  createCollegeWithAdmin,
  getAllPlacementData,
  getAllColleges,
  getDashboardStats
} = require('../controllers/superAdminController');

/**
 * SUPER ADMIN ROUTES
 * 
 * ⚠️ ALL ROUTES REQUIRE 'superadmin' ROLE ⚠️
 * 
 * These routes provide global access across all colleges:
 * - Create new colleges with admins
 * - View all colleges and their statistics
 * - Access placement data from all colleges
 * - Dashboard with global statistics
 */

// All Super Admin routes require authentication and 'superadmin' role
router.use(authenticate);
router.use(requireRole(['superadmin']));

/**
 * POST /api/superadmin/colleges
 * Create a new college with its admin (Transaction)
 * 
 * Body: {
 *   collegeName: string,
 *   collegeAddress: string,
 *   collegeCode: string,
 *   subscriptionStatus?: 'active' | 'trial' | 'expired',
 *   adminName: string,
 *   adminEmail: string,
 *   adminUsername: string,
 *   adminPassword: string
 * }
 */
router.post('/colleges', createCollegeWithAdmin);

/**
 * GET /api/superadmin/colleges
 * Get all colleges with their admins and statistics
 */
router.get('/colleges', getAllColleges);

/**
 * GET /api/superadmin/placement-data
 * Get placement data (jobs, students, users) across all colleges
 * 
 * Query: ?dataType=jobs|students|users|colleges
 */
router.get('/placement-data', getAllPlacementData);

/**
 * GET /api/superadmin/dashboard-stats
 * Get dashboard statistics (global view)
 * Returns: totalColleges, totalStudents, totalJobs, totalAdmins
 */
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;
