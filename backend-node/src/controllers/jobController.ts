import { Response } from 'express';
import { Job, Application } from '@models/index';
import StudentData from '../models/StudentData';
import { checkEligibility as checkEligibilityService } from '../services/eligibilityService';
import type { IAuthRequest } from '../types/index';

/**
 * Create Job Posting
 * ADMIN/MODERATOR ONLY
 * Jobs are automatically assigned to the user's college
 */
export const createJob = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const jobData = req.body;

    if (!jobData.title || !jobData.company || !jobData.description || !jobData.location || !jobData.deadline) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, company, description, location, deadline'
      });
      return;
    }

    let eligibilityToSave: any = {};

    if (jobData.eligibilityType) {
      eligibilityToSave.eligibilityType = jobData.eligibilityType;

      if (jobData.eligibilityType === 'common') {
        if (jobData.commonEligibility) {
          eligibilityToSave.commonEligibility = {
            tenth: jobData.commonEligibility.tenth || 0,
            twelfth: jobData.commonEligibility.twelfth || 0,
            cgpa: jobData.commonEligibility.cgpa || 0
          };
        }
      } else if (jobData.eligibilityType === 'department-wise') {
        if (jobData.departmentWiseEligibility && Array.isArray(jobData.departmentWiseEligibility)) {
          eligibilityToSave.departmentWiseEligibility = jobData.departmentWiseEligibility.map((dept: any) => ({
            department: dept.department,
            tenth: dept.tenth || 0,
            twelfth: dept.twelfth || 0,
            cgpa: dept.cgpa || 0
          }));
        }
      }
    } else {
      eligibilityToSave.eligibilityType = 'common';
      if (jobData.commonEligibility) {
        eligibilityToSave.commonEligibility = {
          tenth: jobData.commonEligibility.tenth || 0,
          twelfth: jobData.commonEligibility.twelfth || 0,
          cgpa: jobData.commonEligibility.cgpa || 0
        };
      }
    }

    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    const newJob = new Job({
      ...jobData,
      ...eligibilityToSave,
      collegeId,
      postedBy: req.user?._id,
      status: jobData.status || 'active',
      publishDate: jobData.publishDate || Date.now()
    });

    await newJob.save();
    await newJob.populate('postedBy', 'username fullName role');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: newJob
    });

  } catch (error: any) {
    console.error('Create job error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating job'
    });
  }
};

/**
 * Get All Jobs for User's College
 */
export const getJobs = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { status, jobType, jobCategory, priority, includeExpired } = req.query;

    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;
    const filter: any = { collegeId };

    if (status) filter.status = status;
    if (jobType) filter.jobType = jobType;
    if (jobCategory) filter.jobCategory = jobCategory;
    if (priority) filter.priority = priority;

    if (!includeExpired && !status) {
      // If no status preference is given, we usually show active. 
      // But if we want to show everything, we shouldn't filter by deadline here unless requested.
      // Let's keep existing logic: if !includeExpired, filter by deadline.
      filter.deadline = { $gte: new Date() };
    }

    // 1. Find jobs matching basic filters
    const jobs = await Job.find(filter)
      .populate('postedBy', 'username fullName role')
      .sort({ priority: -1, createdAt: -1 });

    // 2. Auto-close expired jobs (Lazy Update)
    // This ensures that if a job is "active" but deadline passed, it becomes "closed" in DB.
    const now = new Date();
    const updates = [];

    for (const job of jobs) {
      if (job.status === 'active' && job.deadline && new Date(job.deadline) < now) {
        job.status = 'closed';
        updates.push(Job.updateOne({ _id: job._id }, { status: 'closed' }));
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    const enrichedJobs = jobs.map(job => ({
      ...(job.toObject()),
      isExpired: (job as any).isExpired?.() || (job.deadline && new Date(job.deadline) < now) || false,
      isRegistrationOpen: (job as any).isRegistrationOpen?.() || false,
      daysRemaining: (job as any).getDaysRemaining?.() || 0,
      isClosingSoon: (job as any).isClosingSoon?.() || false
    }));

    res.json({
      success: true,
      count: enrichedJobs.length,
      jobs: enrichedJobs
    });

  } catch (error: any) {
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
export const getJobById = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    const job = await Job.findOne({ _id: id, collegeId })
      .populate('postedBy', 'username fullName role')
      .populate('collegeId', 'name code location');

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found or does not belong to your college'
      });
      return;
    }

    res.json({
      success: true,
      job
    });

  } catch (error: any) {
    console.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching job'
    });
  }
};

/**
 * Update Job
 */
export const updateJob = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    const job = await Job.findOne({ _id: id, collegeId });

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found or does not belong to your college'
      });
      return;
    }

    const protectedFields = ['_id', 'collegeId', 'postedBy', 'createdAt', 'currentApplicationCount'];
    Object.keys(updates).forEach(key => {
      if (!protectedFields.includes(key)) {
        (job as any)[key] = updates[key];
      }
    });

    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      job
    });

  } catch (error: any) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating job'
    });
  }
};

/**
 * Delete Job
 */
export const deleteJob = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    const job = await Job.findOne({ _id: id, collegeId });

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found or does not belong to your college'
      });
      return;
    }

    await Job.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting job'
    });
  }
};

/**
 * Extend Job Deadline
 */
export const extendDeadline = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newDeadline } = req.body;
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    if (!newDeadline) {
      res.status(400).json({
        success: false,
        message: 'New deadline is required'
      });
      return;
    }

    const job = await Job.findOne({ _id: id, collegeId });

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    const newDeadlineDate = new Date(newDeadline);

    if (newDeadlineDate <= new Date()) {
      res.status(400).json({
        success: false,
        message: 'New deadline must be in the future'
      });
      return;
    }

    if ((job as any).extendDeadline) {
      (job as any).extendDeadline(newDeadlineDate);
    } else {
      (job as any).deadline = newDeadlineDate;
      (job as any).deadlineExtended = true;
    }

    await job.save();

    res.json({
      success: true,
      message: 'Deadline extended successfully',
      job: {
        id: job._id,
        title: (job as any).title,
        originalDeadline: (job as any).originalDeadline,
        newDeadline: (job as any).deadline,
        deadlineExtended: (job as any).deadlineExtended
      }
    });

  } catch (error: any) {
    console.error('Extend deadline error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error extending deadline'
    });
  }
};

/**
 * Check Eligibility
 */
export const checkEligibility = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    const student = await StudentData.findOne({ userId });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const result = checkEligibilityService(student, job);

    res.json({
      success: true,
      eligible: result.eligible,
      reasons: result.reasons
    });

  } catch (error: any) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking eligibility'
    });
  }
};

/**
 * Get Job Statistics
 */
export const getJobStatistics = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    const job = await Job.findOne({ _id: id, collegeId });
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    // Get all students for this college
    // Optimize: Fetch only necessary fields for eligibility check
    const students = await StudentData.find({ collegeId })
      .select('skills technicalSkills education currentBacklogs gapYears gender');

    // Get all applications for this job
    const applications = await Application.find({ jobId: id }).select('studentId');
    const appliedStudentIds = new Set(applications.map(app => app.studentId.toString()));
    const appliedCount = applications.length;

    let eligibleCount = 0;

    // Check eligibility for each student
    const eligibleStudents = students.filter(student => {
      const check = checkEligibilityService(student, job);
      return check.eligible;
    });

    eligibleCount = eligibleStudents.length;

    // Calculate Eligible but Not Applied
    // Count students who are in eligibleStudents BUT NOT in appliedStudentIds
    const notAppliedCount = eligibleStudents.filter(s => !appliedStudentIds.has(s._id.toString()) && !appliedStudentIds.has(s.userId?.toString())).length;

    // Wait, StudentData._id vs userId
    // eligibilityService takes StudentData.
    // Application usually links to Student (User) or StudentData? 
    // Application schema usually has 'studentId' (User ID).
    // StudentData has 'userId'.
    // If Application.studentId refers to User ID, I need to check student.userId.
    // But fetch queries didn't populate userId.
    // I should select userId in StudentData query.

    res.json({
      success: true,
      stats: {
        totalEligible: eligibleCount,
        applied: appliedCount,
        notApplied: notAppliedCount
      }
    });

  } catch (error: any) {
    console.error('Get job statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
};

/**
 * Bulk Update Status
 */
export const bulkUpdateStatus = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { jobIds, status } = req.body;
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Please provide an array of job IDs'
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Please provide a status'
      });
      return;
    }

    const result = await Job.updateMany(
      { _id: { $in: jobIds }, collegeId },
      { status }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} jobs`,
      modifiedCount: result.modifiedCount
    });

  } catch (error: any) {
    console.error('Bulk update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating jobs'
    });
  }
};

/**
 * Close Expired Jobs
 */
export const closeExpiredJobs = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    const result = await Job.updateMany(
      {
        collegeId,
        deadline: { $lt: new Date() },
        status: { $ne: 'closed' }
      },
      { status: 'closed' }
    );

    res.json({
      success: true,
      message: `Closed ${result.modifiedCount} expired jobs`,
      closedCount: result.modifiedCount
    });

  } catch (error: any) {
    console.error('Close expired jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error closing jobs'
    });
  }
};

/**
 * Get Jobs Closing Soon
 */
export const getJobsClosingSoon = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;
    const daysThreshold = parseInt(req.query.days as string) || 3;

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const jobs = await Job.find({
      collegeId,
      status: 'active',
      deadline: {
        $gte: new Date(),
        $lte: thresholdDate
      }
    })
      .populate('postedBy', 'username fullName role')
      .sort({ deadline: 1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });

  } catch (error: any) {
    console.error('Get jobs closing soon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching jobs'
    });
  }
};

/**
 * Change Job Status
 */
export const changeJobStatus = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const collegeId = (req.user?.collegeId as any)?._id || req.user?.collegeId;

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Please provide a status'
      });
      return;
    }

    const job = await Job.findOne({ _id: id, collegeId });

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    (job as any).status = status;
    await job.save();

    res.json({
      success: true,
      message: 'Job status updated successfully',
      job
    });

  } catch (error: any) {
    console.error('Change job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating job status'
    });
  }
};
