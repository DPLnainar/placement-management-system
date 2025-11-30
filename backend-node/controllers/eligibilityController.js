const Job = require('../models/Job');
const StudentData = require('../models/StudentData');
const Application = require('../models/Application');
const PlacementDrive = require('../models/PlacementDrive');

/**
 * Eligibility Matching Engine
 * 
 * Automatically matches students to jobs based on eligibility criteria
 * Provides intelligent job recommendations
 */

/**
 * Check student eligibility for a specific job
 */
exports.checkEligibility = async (req, res) => {
  try {
    const { jobId } = req.params;
    const studentId = req.user._id;

    // Get job with eligibility criteria
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get student data
    const studentData = await StudentData.findOne({ userId: studentId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please complete your profile.'
      });
    }

    // Check basic profile completion
    if (!studentData.isProfileCompleted || !studentData.mandatoryFieldsCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before checking eligibility',
        profileCompleted: false
      });
    }

    // Use job's eligibility checking method
    const eligibilityResult = job.checkEligibility(studentData);

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId: jobId,
      studentId: studentId
    });

    // Check placement drive rules if applicable
    let driveEligibility = { allowed: true };
    if (job.placementDriveId) {
      const drive = await PlacementDrive.findById(job.placementDriveId);
      if (drive) {
        driveEligibility = drive.canStudentApply(studentData, job);
      }
    }

    res.json({
      success: true,
      data: {
        isEligible: eligibilityResult.isEligible && driveEligibility.allowed,
        eligibilityIssues: eligibilityResult.issues,
        driveRestrictions: driveEligibility.allowed ? null : driveEligibility.reason,
        alreadyApplied: !!existingApplication,
        applicationStatus: existingApplication ? existingApplication.status : null,
        canApply: eligibilityResult.isEligible && 
                  driveEligibility.allowed && 
                  !existingApplication &&
                  job.isRegistrationOpen()
      }
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking eligibility'
    });
  }
};

/**
 * Get eligible jobs for current student
 */
exports.getEligibleJobs = async (req, res) => {
  try {
    const studentId = req.user._id;
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { category, tier, includeApplied = false } = req.query;

    // Get student data
    const studentData = await StudentData.findOne({ userId: studentId });
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Build query for active jobs
    const query = {
      collegeId: collegeId,
      status: 'active',
      deadline: { $gte: new Date() }
    };

    if (category) query.jobCategory = category;
    if (tier) query.companyTier = tier;

    // Get all active jobs
    const allJobs = await Job.find(query)
      .populate('postedBy', 'username fullName')
      .sort({ createdAt: -1 });

    // Get student's applications
    const applications = await Application.find({ studentId: studentId });
    const appliedJobIds = applications.map(app => app.jobId.toString());

    // Filter jobs based on eligibility
    const jobsWithEligibility = allJobs.map(job => {
      const eligibilityCheck = job.checkEligibility(studentData);
      const alreadyApplied = appliedJobIds.includes(job._id.toString());
      
      return {
        ...job.toObject(),
        eligibilityCheck: {
          isEligible: eligibilityCheck.isEligible,
          issues: eligibilityCheck.issues
        },
        alreadyApplied: alreadyApplied,
        canApply: eligibilityCheck.isEligible && !alreadyApplied && job.isRegistrationOpen()
      };
    });

    // Filter based on includeApplied parameter
    const filteredJobs = includeApplied 
      ? jobsWithEligibility 
      : jobsWithEligibility.filter(job => job.eligibilityCheck.isEligible);

    res.json({
      success: true,
      data: {
        jobs: filteredJobs,
        totalJobs: filteredJobs.length,
        eligibleJobs: filteredJobs.filter(j => j.eligibilityCheck.isEligible).length,
        appliedJobs: filteredJobs.filter(j => j.alreadyApplied).length
      }
    });
  } catch (error) {
    console.error('Get eligible jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching eligible jobs'
    });
  }
};

/**
 * Get eligible students for a job (Admin/Moderator)
 */
exports.getEligibleStudents = async (req, res) => {
  try {
    const { jobId } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { includeIneligible = false, department } = req.query;

    // Verify job exists and belongs to college
    const job = await Job.findOne({ _id: jobId, collegeId: collegeId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Build query for students
    const studentQuery = { 
      collegeId: collegeId,
      isProfileCompleted: true,
      mandatoryFieldsCompleted: true
    };

    // Filter by department if moderator
    if (req.user.role === 'moderator' && req.user.department) {
      studentQuery.branch = req.user.department;
    } else if (department) {
      studentQuery.branch = department;
    }

    // Get all student data
    const students = await StudentData.find(studentQuery)
      .populate('userId', 'username email fullName status');

    // Get applications for this job
    const applications = await Application.find({ jobId: jobId });
    const appliedStudentIds = applications.map(app => app.studentId.toString());

    // Check eligibility for each student
    const studentsWithEligibility = students.map(student => {
      const eligibilityCheck = job.checkEligibility(student);
      const hasApplied = appliedStudentIds.includes(student.userId._id.toString());
      const application = applications.find(app => 
        app.studentId.toString() === student.userId._id.toString()
      );

      return {
        studentId: student.userId._id,
        username: student.userId.username,
        email: student.userId.email,
        fullName: student.userId.fullName,
        rollNumber: student.rollNumber,
        branch: student.branch,
        cgpa: student.cgpa,
        tenthPercentage: student.tenthPercentage,
        twelfthPercentage: student.twelfthPercentage,
        totalBacklogs: student.totalBacklogs,
        currentBacklogs: student.currentBacklogs,
        placementStatus: student.placementStatus,
        isEligible: eligibilityCheck.isEligible,
        eligibilityIssues: eligibilityCheck.issues,
        hasApplied: hasApplied,
        applicationStatus: application ? application.status : null,
        applicationDate: application ? application.appliedAt : null
      };
    });

    // Filter based on includeIneligible
    const filteredStudents = includeIneligible
      ? studentsWithEligibility
      : studentsWithEligibility.filter(s => s.isEligible);

    // Group by status
    const summary = {
      totalStudents: filteredStudents.length,
      eligible: filteredStudents.filter(s => s.isEligible).length,
      ineligible: filteredStudents.filter(s => !s.isEligible).length,
      applied: filteredStudents.filter(s => s.hasApplied).length,
      notApplied: filteredStudents.filter(s => s.isEligible && !s.hasApplied).length
    };

    res.json({
      success: true,
      data: {
        students: filteredStudents,
        summary: summary,
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          eligibilityCriteria: job.eligibilityCriteria
        }
      }
    });
  } catch (error) {
    console.error('Get eligible students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching eligible students'
    });
  }
};

/**
 * Bulk eligibility check for multiple students (Admin/Moderator)
 */
exports.bulkEligibilityCheck = async (req, res) => {
  try {
    const { jobId, studentIds } = req.body;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    if (!jobId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Job ID and student IDs array required'
      });
    }

    // Get job
    const job = await Job.findOne({ _id: jobId, collegeId: collegeId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get students data
    const students = await StudentData.find({
      userId: { $in: studentIds },
      collegeId: collegeId
    }).populate('userId', 'username fullName email');

    const results = students.map(student => {
      const eligibilityCheck = job.checkEligibility(student);
      
      return {
        studentId: student.userId._id,
        username: student.userId.username,
        fullName: student.userId.fullName,
        isEligible: eligibilityCheck.isEligible,
        issues: eligibilityCheck.issues
      };
    });

    res.json({
      success: true,
      data: {
        total: results.length,
        eligible: results.filter(r => r.isEligible).length,
        ineligible: results.filter(r => !r.isEligible).length,
        results: results
      }
    });
  } catch (error) {
    console.error('Bulk eligibility check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk eligibility check'
    });
  }
};

/**
 * Get job recommendations for student based on profile
 */
exports.getJobRecommendations = async (req, res) => {
  try {
    const studentId = req.user._id;
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { limit = 10 } = req.query;

    // Get student data
    const studentData = await StudentData.findOne({ userId: studentId });
    if (!studentData || !studentData.isProfileCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile to get recommendations'
      });
    }

    // Get all active jobs
    const jobs = await Job.find({
      collegeId: collegeId,
      status: 'active',
      deadline: { $gte: new Date() }
    });

    // Get student's applications
    const applications = await Application.find({ studentId: studentId });
    const appliedJobIds = applications.map(app => app.jobId.toString());

    // Score jobs based on match
    const scoredJobs = jobs
      .filter(job => !appliedJobIds.includes(job._id.toString()))
      .map(job => {
        const eligibilityCheck = job.checkEligibility(studentData);
        let score = 0;

        // Base score for eligibility
        if (eligibilityCheck.isEligible) {
          score += 50;

          // Bonus for skill match
          if (job.eligibilityCriteria.requiredSkills && studentData.skills) {
            const matchedSkills = job.eligibilityCriteria.requiredSkills.filter(skill =>
              studentData.skills.includes(skill)
            );
            score += (matchedSkills.length / job.eligibilityCriteria.requiredSkills.length) * 30;
          }

          // Bonus for preferred location
          if (job.workLocation && studentData.placementPreferences.preferredLocations) {
            if (studentData.placementPreferences.preferredLocations.includes(job.workLocation)) {
              score += 10;
            }
          }

          // Bonus for company tier
          if (job.companyTier === 'super_dream') score += 10;
          else if (job.companyTier === 'dream') score += 5;
        }

        return {
          ...job.toObject(),
          matchScore: score,
          isEligible: eligibilityCheck.isEligible,
          eligibilityIssues: eligibilityCheck.issues
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        recommendations: scoredJobs,
        total: scoredJobs.length
      }
    });
  } catch (error) {
    console.error('Get job recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job recommendations'
    });
  }
};

module.exports = {
  checkEligibility: exports.checkEligibility,
  getEligibleJobs: exports.getEligibleJobs,
  getEligibleStudents: exports.getEligibleStudents,
  bulkEligibilityCheck: exports.bulkEligibilityCheck,
  getJobRecommendations: exports.getJobRecommendations
};
