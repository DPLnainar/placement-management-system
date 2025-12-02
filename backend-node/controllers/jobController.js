const Job = require('../models/Job');
const { DEPARTMENT_CODES } = require('../constants/departments');

/**
 * Create Job Posting
 * 
 * ADMIN/MODERATOR ONLY
 * 
 * Jobs are automatically assigned to the user's college
 */
exports.createJob = async (req, res) => {
  try {
    const jobData = req.body;

    // Validate required fields
    if (!jobData.title || !jobData.company || !jobData.description || !jobData.location || !jobData.deadline) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields: title, company, description, location, deadline' 
      });
    }

    // Handle eligibility based on type
    let eligibilityToSave = {};
    
    if (jobData.eligibilityType) {
      eligibilityToSave.eligibilityType = jobData.eligibilityType;

      if (jobData.eligibilityType === 'common') {
        // For common eligibility, save commonEligibility with tenth, twelfth, cgpa
        if (jobData.commonEligibility) {
          eligibilityToSave.commonEligibility = {
            tenth: jobData.commonEligibility.tenth || 0,
            twelfth: jobData.commonEligibility.twelfth || 0,
            cgpa: jobData.commonEligibility.cgpa || 0
          };
        }
      } else if (jobData.eligibilityType === 'department-wise') {
        // For department-wise, save departmentWiseEligibility array
        if (jobData.departmentWiseEligibility && Array.isArray(jobData.departmentWiseEligibility)) {
          eligibilityToSave.departmentWiseEligibility = jobData.departmentWiseEligibility.map(dept => ({
            department: dept.department,
            tenth: dept.tenth || 0,
            twelfth: dept.twelfth || 0,
            cgpa: dept.cgpa || 0
          }));
        }
      }
    } else {
      // Default to common eligibility if type not specified (backward compatibility)
      eligibilityToSave.eligibilityType = 'common';
      if (jobData.commonEligibility) {
        eligibilityToSave.commonEligibility = {
          tenth: jobData.commonEligibility.tenth || 0,
          twelfth: jobData.commonEligibility.twelfth || 0,
          cgpa: jobData.commonEligibility.cgpa || 0
        };
      }
    }

    // Create new job with all fields
    const newJob = new Job({
      ...jobData,
      ...eligibilityToSave,
      collegeId: req.user.collegeId._id || req.user.collegeId,
      postedBy: req.user._id,
      status: jobData.status || 'active',
      publishDate: jobData.publishDate || Date.now()
    });

    await newJob.save();

    // Populate user info
    await newJob.populate('postedBy', 'username fullName role');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: newJob
    });

  } catch (error) {
    console.error('Create job error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error creating job' 
    });
  }
};

/**
 * Get All Jobs for User's College
 * 
 * Returns all jobs from authenticated user's college
 */
exports.getJobs = async (req, res) => {
  try {
    const { status, jobType, jobCategory, priority, includeExpired } = req.query;
    
    // Build query filter
    const filter = { 
      collegeId: req.user.collegeId._id || req.user.collegeId 
    };

    // Optional filters
    if (status) {
      filter.status = status;
    }

    if (jobType) {
      filter.jobType = jobType;
    }
    
    if (jobCategory) {
      filter.jobCategory = jobCategory;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    // Exclude expired jobs unless explicitly requested
    if (!includeExpired) {
      filter.deadline = { $gte: new Date() };
    }

    // Fetch jobs
    const jobs = await Job.find(filter)
      .populate('postedBy', 'username fullName role')
      .sort({ priority: -1, createdAt: -1 });

    // Add computed fields for each job
    const enrichedJobs = jobs.map(job => ({
      ...job.toObject(),
      isExpired: job.isExpired(),
      isRegistrationOpen: job.isRegistrationOpen(),
      daysRemaining: job.getDaysRemaining(),
      isClosingSoon: job.isClosingSoon()
    }));

    res.json({
      success: true,
      count: enrichedJobs.length,
      jobs: enrichedJobs
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching jobs' 
    });
  }
};

/**
 * Get Job by ID
 */
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({
      _id: id,
      collegeId: req.user.collegeId._id || req.user.collegeId
    })
      .populate('postedBy', 'username fullName role')
      .populate('collegeId', 'name code location');

    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or does not belong to your college' 
      });
    }

    res.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching job' 
    });
  }
};

/**
 * Update Job
 * 
 * ADMIN/MODERATOR ONLY
 */
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find job and ensure it belongs to user's college
    const job = await Job.findOne({
      _id: id,
      collegeId: req.user.collegeId._id || req.user.collegeId
    });

    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or does not belong to your college' 
      });
    }

    // Update all fields (excluding protected ones)
    const protectedFields = ['_id', 'collegeId', 'postedBy', 'createdAt', 'currentApplicationCount'];
    Object.keys(updates).forEach(key => {
      if (!protectedFields.includes(key)) {
        job[key] = updates[key];
      }
    });

    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      job
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating job' 
    });
  }
};

/**
 * Delete Job
 * 
 * ADMIN/MODERATOR ONLY
 */
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Find job and ensure it belongs to user's college
    const job = await Job.findOne({
      _id: id,
      collegeId: req.user.collegeId._id || req.user.collegeId
    });

    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: 'Job not found or does not belong to your college' 
      });
    }

    await Job.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting job' 
    });
  }
};

/**
 * Extend Job Deadline
 * 
 * ADMIN/MODERATOR ONLY
 */
exports.extendDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDeadline, reason } = req.body;

    if (!newDeadline) {
      return res.status(400).json({
        success: false,
        message: 'New deadline is required'
      });
    }

    const job = await Job.findOne({
      _id: id,
      collegeId: req.user.collegeId._id || req.user.collegeId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const newDeadlineDate = new Date(newDeadline);
    
    // Validate new deadline is in the future
    if (newDeadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'New deadline must be in the future'
      });
    }

    // Extend the deadline
    job.extendDeadline(newDeadlineDate);
    await job.save();

    res.json({
      success: true,
      message: 'Deadline extended successfully',
      job: {
        id: job._id,
        title: job.title,
        originalDeadline: job.originalDeadline,
        newDeadline: job.deadline,
        deadlineExtended: job.deadlineExtended
      }
    });

  } catch (error) {
    console.error('Extend deadline error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error extending deadline'
    });
  }
};

/**
 * Check Student Eligibility for Job
 * 
 * STUDENT/ADMIN/MODERATOR
 */
exports.checkEligibility = async (req, res) => {
  try {
    const { id } = req.params;
    const StudentData = require('../models/StudentData');

    const job = await Job.findOne({
      _id: id,
      collegeId: req.user.collegeId._id || req.user.collegeId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get student data
    const studentData = await StudentData.findOne({ userId: req.user._id });

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student data not found. Please complete your profile first.'
      });
    }

    // Check eligibility
    const eligibilityResult = job.checkEligibility(studentData);

    res.json({
      success: true,
      isEligible: eligibilityResult.isEligible,
      issues: eligibilityResult.issues,
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      }
    });

  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking eligibility'
    });
  }
};

/**
 * Get Job Statistics
 * 
 * ADMIN/MODERATOR ONLY
 */
exports.getJobStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const Application = require('../models/Application');

    const job = await Job.findOne({
      _id: id,
      collegeId: req.user.collegeId._id || req.user.collegeId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get application statistics
    const applications = await Application.find({ jobId: id });
    
    const stats = {
      totalApplications: applications.length,
      applicationsByStatus: {
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length
      },
      daysRemaining: job.getDaysRemaining(),
      isExpired: job.isExpired(),
      isClosingSoon: job.isClosingSoon(),
      registrationOpen: job.isRegistrationOpen(),
      maxApplications: job.maxApplications,
      currentApplicationCount: job.currentApplicationCount,
      applicationLimit: job.maxApplications ? 
        `${job.currentApplicationCount}/${job.maxApplications}` : 'Unlimited'
    };

    res.json({
      success: true,
      statistics: stats,
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        status: job.status
      }
    });

  } catch (error) {
    console.error('Get job statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
};

/**
 * Bulk Update Job Status
 * 
 * ADMIN ONLY
 */
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { jobIds, status } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Job IDs array is required'
      });
    }

    if (!status || !['draft', 'active', 'inactive', 'closed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (draft, active, inactive, closed, cancelled)'
      });
    }

    // Update jobs that belong to user's college
    const result = await Job.updateMany(
      {
        _id: { $in: jobIds },
        collegeId: req.user.collegeId._id || req.user.collegeId
      },
      {
        $set: { status }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} jobs updated successfully`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating jobs'
    });
  }
};

/**
 * Auto-Close Expired Jobs
 * 
 * ADMIN/SYSTEM - Can be called via cron job
 */
exports.closeExpiredJobs = async (req, res) => {
  try {
    const now = new Date();

    // Find and close expired jobs
    const result = await Job.updateMany(
      {
        deadline: { $lt: now },
        status: 'active',
        collegeId: req.user.collegeId._id || req.user.collegeId
      },
      {
        $set: { status: 'closed' }
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} expired jobs closed automatically`,
      closedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Close expired jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error closing expired jobs'
    });
  }
};

/**
 * Get Jobs Closing Soon
 * 
 * Returns jobs closing within next 3 days
 */
exports.getJobsClosingSoon = async (req, res) => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const jobs = await Job.find({
      collegeId: req.user.collegeId._id || req.user.collegeId,
      status: 'active',
      deadline: {
        $gte: new Date(),
        $lte: threeDaysFromNow
      }
    })
      .populate('postedBy', 'username fullName role')
      .sort({ deadline: 1 });

    const enrichedJobs = jobs.map(job => ({
      ...job.toObject(),
      daysRemaining: job.getDaysRemaining(),
      isClosingSoon: true
    }));

    res.json({
      success: true,
      count: enrichedJobs.length,
      jobs: enrichedJobs
    });

  } catch (error) {
    console.error('Get jobs closing soon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching jobs'
    });
  }
};

