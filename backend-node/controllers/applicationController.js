const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

/**
 * Create Application
 * 
 * STUDENT ONLY
 * Students can apply to jobs in their college
 */
exports.createApplication = async (req, res) => {
  try {
    const { jobId } = req.body;
    const studentId = req.user._id;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    // Verify job exists and belongs to student's college
    const job = await Job.findOne({
      _id: jobId,
      collegeId: collegeId,
      status: 'active'
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not available'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      studentId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    // Check if job deadline has passed
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Create application
    const application = new Application({
      jobId,
      studentId,
      collegeId,
      status: 'pending'
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application: {
          id: application._id,
          jobId: application.jobId,
          studentId: application.studentId,
          status: application.status,
          appliedAt: application.appliedAt
        }
      }
    });

  } catch (error) {
    console.error('Create application error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating application'
    });
  }
};

/**
 * Get Applications
 * 
 * Students: Get their own applications
 * Admins/Moderators: Get all applications for their college
 */
exports.getApplications = async (req, res) => {
  try {
    const { jobId } = req.query;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    let filter = { collegeId };

    // Students can only see their own applications
    if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    }

    // Filter by jobId if provided
    if (jobId) {
      filter.jobId = jobId;
    }

    const applications = await Application.find(filter)
      .populate('jobId', 'title company location salary status')
      .populate('studentId', 'fullName email department')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      data: applications.map(app => ({
        id: app._id,
        jobId: app.jobId?._id,
        job: app.jobId,
        studentId: app.studentId?._id,
        student: app.studentId,
        status: app.status,
        appliedAt: app.appliedAt,
        createdAt: app.createdAt
      }))
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching applications'
    });
  }
};

/**
 * Update Application Status
 * 
 * ADMIN/MODERATOR ONLY
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    if (!['pending', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, accepted, rejected, or withdrawn'
      });
    }

    // Find application and verify it belongs to admin's college
    const application = await Application.findOne({
      _id: id,
      collegeId: collegeId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await application.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application: {
          id: application._id,
          status: application.status
        }
      }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating application status'
    });
  }
};

module.exports = {
  createApplication: exports.createApplication,
  getApplications: exports.getApplications,
  updateApplicationStatus: exports.updateApplicationStatus
};
