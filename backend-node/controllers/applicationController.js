const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const StudentData = require('../models/StudentData');

/**
 * Create Application
 * 
 * STUDENT ONLY
 * Students can apply to jobs in their college
 * Eligible students are automatically approved without moderator intervention
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

    // Get student data to check profile completion
    const studentData = await StudentData.findOne({ userId: studentId });
    
    if (!studentData) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before applying to jobs',
        profileIncomplete: true
      });
    }

    // Check if essential profile fields are completed
    const requiredFields = {
      personal: ['phoneNumber', 'dateOfBirth', 'gender', 'currentAddress'],
      academic: ['cgpa', 'tenthPercentage', 'twelfthPercentage', 'branch', 'yearOfStudy', 'rollNumber']
    };

    const missingFields = [];

    // Check personal details
    requiredFields.personal.forEach(field => {
      if (!studentData[field] || studentData[field] === null || studentData[field] === '') {
        missingFields.push(field);
      }
    });

    // Check academic details
    requiredFields.academic.forEach(field => {
      if (!studentData[field] || studentData[field] === null || studentData[field] === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before applying to jobs. Missing fields: ' + 
                 missingFields.map(f => f.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', '),
        profileIncomplete: true,
        missingFields: missingFields
      });
    }
    
    // Check eligibility - BLOCK ineligible students from applying
    let eligibilityCheck = { isEligible: true, issues: [] };
    
    if (studentData && job.checkEligibility) {
      eligibilityCheck = job.checkEligibility(studentData);
    }
    
    // If student is NOT eligible, reject the application
    if (!eligibilityCheck.isEligible) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible for this job position',
        notEligible: true,
        eligibilityIssues: eligibilityCheck.issues || [],
        canApply: false,
        data: {
          job: {
            id: job._id,
            title: job.title,
            company: job.company
          }
        }
      });
    }

    // Create application for eligible students
    const applicationStatus = 'under_review'; // Default: under review
    
    const application = new Application({
      jobId,
      studentId,
      collegeId,
      status: applicationStatus, // Auto-approved for eligible students
      eligibilityCheck: {
        isEligible: eligibilityCheck.isEligible,
        eligibilityIssues: eligibilityCheck.issues || [],
        checkedDate: new Date()
      }
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: eligibilityCheck.isEligible 
        ? 'Application submitted and automatically approved - you are eligible!' 
        : 'Application submitted successfully',
      data: {
        application: {
          id: application._id,
          jobId: application.jobId,
          studentId: application.studentId,
          status: application.status,
          isEligible: eligibilityCheck.isEligible,
          eligibilityIssues: eligibilityCheck.issues,
          appliedAt: application.appliedAt,
          message: eligibilityCheck.isEligible 
            ? 'Your application has been automatically approved. Good luck!' 
            : 'Your application is under review.'
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
