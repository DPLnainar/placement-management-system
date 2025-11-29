const Job = require('../models/Job');

/**
 * Create Job Posting
 * 
 * ADMIN/MODERATOR ONLY
 * 
 * Jobs are automatically assigned to the user's college
 */
exports.createJob = async (req, res) => {
  try {
    const { title, company, description, salary, location, jobType, deadline } = req.body;

    // Validate required fields
    if (!title || !company || !description || !location || !deadline) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields: title, company, description, location, deadline' 
      });
    }

    // Create new job
    const newJob = new Job({
      title,
      company,
      description,
      salary,
      location,
      jobType: jobType || 'full-time',
      deadline: new Date(deadline),
      collegeId: req.user.collegeId._id || req.user.collegeId,
      postedBy: req.user._id,
      status: 'active'
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
    const { status, jobType } = req.query;
    
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

    // Fetch jobs
    const jobs = await Job.find(filter)
      .populate('postedBy', 'username fullName role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs: jobs.map(job => ({
        id: job._id,
        _id: job._id,
        title: job.title,
        company: job.company,
        description: job.description,
        salary: job.salary,
        location: job.location,
        jobType: job.jobType,
        deadline: job.deadline,
        status: job.status,
        requirements: job.requirements,
        postedBy: job.postedBy,
        collegeId: job.collegeId,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }))
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

    // Update allowed fields
    const allowedUpdates = ['title', 'company', 'description', 'salary', 'location', 'jobType', 'deadline', 'status', 'requirements'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
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
