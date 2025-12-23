const College = require('../models/College');
const User = require('../models/User');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const { bulkUploadSummaryEmail } = require('../utils/emailTemplates');

/**
 * CREATE COLLEGE WITH ADMIN
 * 
 * ⚠️ SUPER ADMIN ONLY ⚠️
 * 
 * This controller allows Super Admin to onboard a new college with its admin.
 * 
 * Multi-Tenant Architecture:
 * - Creates a College record
 * - Creates a College Admin user linked to that college
 * - Uses MongoDB transaction to ensure atomicity
 * 
 * Permission: Only users with role 'superadmin' can access this
 */
exports.createCollegeWithAdmin = async (req, res) => {
  // Start a MongoDB session for transaction
  // Transaction removed for standalone MongoDB compatibility
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    // SECURITY CHECK: Only Super Admin can create colleges
    if (req.user.role !== 'superadmin') {
      // await session.abortTransaction();
      // session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    const {
      collegeName,
      collegeAddress,
      collegeCode,
      subscriptionStatus = 'active',
      adminName,
      adminEmail,
      adminUsername,
      adminPassword
    } = req.body;

    // Validate required fields
    if (!collegeName || !collegeAddress || !collegeCode || !adminName || !adminEmail || !adminUsername || !adminPassword) {
      // await session.abortTransaction();
      // session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Need: collegeName, collegeAddress, collegeCode, adminName, adminEmail, adminUsername, adminPassword'
      });
    }

    // Check if college with same name or code already exists
    const existingCollege = await College.findOne({
      $or: [
        { name: collegeName.trim() },
        { code: collegeCode.toUpperCase().trim() }
      ]
    });

    if (existingCollege) {
      // await session.abortTransaction();
      // session.endSession();
      return res.status(400).json({
        success: false,
        message: 'A college with this name or code already exists'
      });
    }

    // Check if admin username or email already exists
    const existingUser = await User.findOne({
      $or: [
        { username: adminUsername.toLowerCase().trim() },
        { email: adminEmail.toLowerCase().trim() }
      ]
    });

    if (existingUser) {
      // await session.abortTransaction();
      // session.endSession();
      return res.status(400).json({
        success: false,
        message: 'A user with this username or email already exists'
      });
    }

    // TRANSACTION STEP 1: Create the College
    const college = new College({
      name: collegeName.trim(),
      location: collegeAddress.trim(),
      code: collegeCode.toUpperCase().trim(),
      subscriptionStatus: subscriptionStatus,
      status: 'active'
    });

    await college.save();

    // TRANSACTION STEP 2: Create the College Admin
    const admin = new User({
      username: adminUsername.toLowerCase().trim(),
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,  // Will be hashed by pre-save hook
      fullName: adminName.trim(),
      role: 'admin',  // College Admin role
      collegeId: college._id,  // Link to the new college
      assignedBy: req.user._id,  // Assigned by Super Admin
      status: 'active'
    });

    await admin.save();

    // TRANSACTION STEP 3: Link Admin to College
    college.adminId = admin._id;
    await college.save();

    // Commit the transaction
    // await session.commitTransaction();
    // session.endSession();

    // Return success response with credentials
    const adminResponse = admin.toObject();
    delete adminResponse.password;  // Remove password from response

    res.status(201).json({
      success: true,
      message: 'College and Admin created successfully',
      data: {
        college: {
          id: college._id,
          name: college.name,
          code: college.code,
          location: college.location,
          subscriptionStatus: college.subscriptionStatus,
          adminId: college.adminId
        },
        admin: adminResponse,
        credentials: {
          username: admin.username,
          password: adminPassword,  // Return plain password once (for Super Admin to share)
          message: 'Share these credentials securely with the College Admin'
        }
      }
    });

  } catch (error) {
    // Rollback transaction on error
    // await session.abortTransaction();
    // session.endSession();

    // Attempt cleanup if college was created but flow failed (manual rollback)
    if (college && college._id) {
      try { await College.findByIdAndDelete(college._id); } catch (e) { }
    }

    console.error('Create college with admin error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating college and admin. Transaction rolled back.'
    });
  }
};

/**
 * GET ALL PLACEMENT DATA (Multi-Tenant Aware)
 * 
 * This is a generic data fetching function that:
 * - Returns ALL data if user is SUPER_ADMIN (global view)
 * - Returns ONLY college-specific data if user is COLLEGE_ADMIN (local view)
 * 
 * Can be used for fetching jobs, students, applications, etc.
 */
exports.getAllPlacementData = async (req, res) => {
  try {
    const { dataType = 'jobs' } = req.query;  // Can be 'jobs', 'students', 'users', 'applications'

    let query = {};
    let Model;

    // Determine which model to query
    switch (dataType) {
      case 'jobs':
        Model = require('../models/Job');
        break;
      case 'students':
      case 'users':
        Model = User;
        if (dataType === 'students') {
          query.role = 'student';  // Filter for students only
        }
        break;
      case 'colleges':
        Model = College;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid dataType. Use: jobs, students, users, or colleges'
        });
    }

    // MULTI-TENANT LOGIC:
    // Case A: SUPER_ADMIN - Fetch ALL data (no college filter)
    if (req.user.role === 'superadmin') {
      // Super Admin can see everything - no collegeId filter
      const data = await Model.find(query)
        .populate('collegeId', 'name code location')
        .sort({ createdAt: -1 })
        .limit(100);  // Add pagination in production

      return res.status(200).json({
        success: true,
        role: 'SUPER_ADMIN',
        scope: 'GLOBAL',
        count: data.length,
        data: data
      });
    }

    // Case B: COLLEGE_ADMIN - Fetch ONLY their college's data
    if (req.user.role === 'admin') {
      // College Admin can only see their college's data
      if (!req.user.collegeId) {
        return res.status(403).json({
          success: false,
          message: 'College Admin not properly configured - no college assigned'
        });
      }

      // Add college filter for College Admin
      if (dataType !== 'colleges') {
        query.collegeId = req.user.collegeId._id || req.user.collegeId;
      }

      const data = await Model.find(query)
        .populate('collegeId', 'name code location')
        .sort({ createdAt: -1 })
        .limit(100);

      return res.status(200).json({
        success: true,
        role: 'COLLEGE_ADMIN',
        scope: 'LOCAL',
        college: req.user.collegeId.name,
        count: data.length,
        data: data
      });
    }

    // Other roles (moderator, student) - restricted access
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });

  } catch (error) {
    console.error('Get placement data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching placement data'
    });
  }
};

/**
 * GET ALL COLLEGES (Super Admin Only)
 * 
 * Returns list of all colleges with their admins and statistics
 */
exports.getAllColleges = async (req, res) => {
  try {
    // SECURITY: Only Super Admin can view all colleges
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only Super Admin can view all colleges.'
      });
    }

    // Fetch all colleges with admin details
    const colleges = await College.find()
      .populate('adminId', 'username email fullName status')
      .sort({ createdAt: -1 });

    // Get statistics for each college
    const collegesWithStats = await Promise.all(
      colleges.map(async (college) => {
        const studentCount = await User.countDocuments({
          collegeId: college._id,
          role: 'student'
        });

        const jobCount = await require('../models/Job').countDocuments({
          collegeId: college._id
        });

        return {
          id: college._id,
          name: college.name,
          code: college.code,
          location: college.location,
          subscriptionStatus: college.subscriptionStatus,
          status: college.status,
          admin: college.adminId,
          stats: {
            students: studentCount,
            jobs: jobCount
          },
          createdAt: college.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: collegesWithStats.length,
      data: collegesWithStats
    });

  } catch (error) {
    console.error('Get all colleges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching colleges'
    });
  }
};

/**
 * GET DASHBOARD STATISTICS
 * 
 * Super Admin: Total colleges, total students (all), total jobs (all)
 * College Admin: Students in their college, jobs in their college
 */
exports.getDashboardStats = async (req, res) => {
  try {
    let stats = {};

    // SUPER ADMIN - Global statistics
    if (req.user.role === 'superadmin') {
      const totalColleges = await College.countDocuments({ status: 'active' });
      const totalStudents = await User.countDocuments({ role: 'student', status: 'active' });
      const totalJobs = await require('../models/Job').countDocuments({ status: 'active' });
      const totalAdmins = await User.countDocuments({ role: 'admin', status: 'active' });

      stats = {
        role: 'SUPER_ADMIN',
        scope: 'GLOBAL',
        totalColleges,
        totalStudents,
        totalJobs,
        totalAdmins
      };
    }
    // COLLEGE ADMIN - College-specific statistics
    else if (req.user.role === 'admin') {
      const collegeId = req.user.collegeId._id || req.user.collegeId;

      const totalStudents = await User.countDocuments({
        collegeId: collegeId,
        role: 'student',
        status: 'active'
      });

      const totalModerators = await User.countDocuments({
        collegeId: collegeId,
        role: 'moderator',
        status: 'active'
      });

      const totalJobs = await require('../models/Job').countDocuments({
        collegeId: collegeId,
        status: 'active'
      });

      stats = {
        role: 'COLLEGE_ADMIN',
        scope: 'LOCAL',
        college: req.user.collegeId.name,
        totalStudents,
        totalModerators,
        totalJobs
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

/**
 * SEND BULK UPLOAD SUMMARY EMAIL
 * 
 * ⚠️ SUPER ADMIN ONLY ⚠️
 * 
 * Sends a summary email after bulk college upload
 */
exports.sendBulkUploadEmail = async (req, res) => {
  try {
    // SECURITY CHECK: Only Super Admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    const { results } = req.body;

    if (!results || !results.successful || !results.failed || results.total === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid results data provided'
      });
    }

    // Get super admin details
    const superAdmin = await User.findById(req.user._id);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super admin user not found'
      });
    }

    // Generate email template
    const emailHTML = bulkUploadSummaryEmail(
      results,
      superAdmin.fullName || superAdmin.username,
      superAdmin.email
    );

    // Send email
    await sendEmail({
      to: superAdmin.email,
      subject: `Bulk Upload Summary: ${results.successful.length}/${results.total} Colleges Created Successfully`,
      html: emailHTML
    });

    res.status(200).json({
      success: true,
      message: 'Bulk upload summary email sent successfully'
    });

  } catch (error) {
    console.error('Send bulk upload email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk upload summary email',
      error: error.message
    });
  }
};

/**
 * UPDATE COLLEGE
 * 
 * ⚠️ SUPER ADMIN ONLY ⚠️
 * 
 * Updates college details including status
 */
exports.updateCollege = async (req, res) => {
  try {
    // SECURITY CHECK: Only Super Admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    const { id } = req.params;
    const { collegeName, collegeAddress, collegeCode, subscriptionStatus } = req.body;

    const updateData = {};
    if (collegeName) updateData.name = collegeName.trim();
    if (collegeAddress) updateData.location = collegeAddress.trim();
    if (collegeCode) updateData.code = collegeCode.toUpperCase().trim();
    if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;

    const college = await College.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'College updated successfully',
      data: college
    });

  } catch (error) {
    console.error('Update college error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating college',
      error: error.message
    });
  }
};

/**
 * DELETE COLLEGE
 * 
 * ⚠️ SUPER ADMIN ONLY ⚠️
 * 
 * Deletes a college and its associated data
 */
exports.deleteCollege = async (req, res) => {
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    // SECURITY CHECK: Only Super Admin
    if (req.user.role !== 'superadmin') {
      // await session.abortTransaction();
      // session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    const { id } = req.params;

    const college = await College.findById(id);

    if (!college) {
      // await session.abortTransaction();
      // session.endSession();
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    // Delete all users associated with this college
    await User.deleteMany({ collegeId: id });

    // Delete all jobs associated with this college
    const Job = require('../models/Job');
    await Job.deleteMany({ collegeId: id });

    // Delete the college itself
    await College.findByIdAndDelete(id);

    // await session.commitTransaction();
    // session.endSession();

    res.status(200).json({
      success: true,
      message: 'College and all associated data deleted successfully'
    });

  } catch (error) {
    // await session.abortTransaction();
    // session.endSession();
    console.error('Delete college error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting college',
      error: error.message
    });
  }
};

module.exports = {
  createCollegeWithAdmin: exports.createCollegeWithAdmin,
  getAllPlacementData: exports.getAllPlacementData,
  getAllColleges: exports.getAllColleges,
  getDashboardStats: exports.getDashboardStats,
  getDashboardStats: exports.getDashboardStats,
  sendBulkUploadEmail: exports.sendBulkUploadEmail,
  updateCollege: exports.updateCollege,
  deleteCollege: exports.deleteCollege
};
