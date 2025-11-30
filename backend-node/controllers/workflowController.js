const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendEmail } = require('../utils/notificationService');

// Update application to next stage
exports.moveToNextStage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { nextStatus, notes, roundDetails } = req.body;
    
    const application = await Application.findOne({
      _id: applicationId,
      collegeId: req.user.college
    }).populate('studentId', 'name email').populate('jobId', 'title company');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update status
    const previousStatus = application.status;
    application.status = nextStatus;
    application.lastUpdatedBy = req.user._id;
    
    // Add round details if provided
    if (roundDetails) {
      application.rounds.push({
        ...roundDetails,
        conductedBy: req.user._id
      });
    }
    
    // Add notification
    application.notifications.push({
      type: 'status_update',
      message: `Application moved from ${previousStatus} to ${nextStatus}`,
      sentBy: req.user._id
    });
    
    if (notes) {
      application.reviewNotes = notes;
    }
    
    await application.save();
    
    // Send email notification
    if (process.env.ENABLE_EMAIL === 'true') {
      await sendEmail({
        to: application.studentId.email,
        subject: `Application Status Update - ${application.jobId.title}`,
        html: `
          <h2>Application Status Update</h2>
          <p>Dear ${application.studentId.name},</p>
          <p>Your application for <strong>${application.jobId.title}</strong> at <strong>${application.jobId.company.name}</strong> has been updated.</p>
          <p><strong>New Status:</strong> ${nextStatus.replace(/_/g, ' ').toUpperCase()}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p>Best regards,<br>Placement Cell</p>
        `
      }).catch(err => console.error('Email error:', err));
    }
    
    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Bulk update application statuses
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { applicationIds, newStatus, notes } = req.body;
    
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Application IDs array is required'
      });
    }
    
    const applications = await Application.find({
      _id: { $in: applicationIds },
      collegeId: req.user.college
    });
    
    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No applications found'
      });
    }
    
    const updatePromises = applications.map(app => {
      app.status = newStatus;
      app.lastUpdatedBy = req.user._id;
      if (notes) app.reviewNotes = notes;
      app.notifications.push({
        type: 'bulk_update',
        message: `Status updated to ${newStatus}`,
        sentBy: req.user._id
      });
      return app.save();
    });
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: `${applications.length} applications updated successfully`,
      updatedCount: applications.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Schedule interview round
exports.scheduleInterview = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { roundName, roundType, scheduledDate, interviewerName, notes } = req.body;
    
    const application = await Application.findOne({
      _id: applicationId,
      collegeId: req.user.college
    }).populate('studentId', 'name email').populate('jobId', 'title company');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Add interview round
    application.rounds.push({
      roundName,
      roundType,
      scheduledDate: new Date(scheduledDate),
      status: 'scheduled',
      interviewerName,
      notes,
      conductedBy: req.user._id
    });
    
    // Update application status
    const statusMap = {
      'aptitude': 'aptitude_scheduled',
      'technical': 'technical_scheduled',
      'hr': 'hr_scheduled'
    };
    
    if (statusMap[roundType]) {
      application.status = statusMap[roundType];
    }
    
    application.lastUpdatedBy = req.user._id;
    
    // Add notification
    application.notifications.push({
      type: 'interview_scheduled',
      message: `${roundName} scheduled for ${new Date(scheduledDate).toLocaleString()}`,
      sentBy: req.user._id
    });
    
    await application.save();
    
    // Send email notification
    if (process.env.ENABLE_EMAIL === 'true') {
      await sendEmail({
        to: application.studentId.email,
        subject: `Interview Scheduled - ${application.jobId.title}`,
        html: `
          <h2>Interview Scheduled</h2>
          <p>Dear ${application.studentId.name},</p>
          <p>You have been scheduled for an interview round.</p>
          <p><strong>Company:</strong> ${application.jobId.company.name}</p>
          <p><strong>Position:</strong> ${application.jobId.title}</p>
          <p><strong>Round:</strong> ${roundName}</p>
          <p><strong>Date & Time:</strong> ${new Date(scheduledDate).toLocaleString()}</p>
          ${interviewerName ? `<p><strong>Interviewer:</strong> ${interviewerName}</p>` : ''}
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p>Best of luck!<br>Placement Cell</p>
        `
      }).catch(err => console.error('Email error:', err));
    }
    
    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update interview result
exports.updateInterviewResult = async (req, res) => {
  try {
    const { applicationId, roundId } = req.params;
    const { status, score, feedback } = req.body;
    
    const application = await Application.findOne({
      _id: applicationId,
      collegeId: req.user.college
    }).populate('studentId', 'name email').populate('jobId', 'title company');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Find and update the specific round
    const round = application.rounds.id(roundId);
    if (!round) {
      return res.status(404).json({
        success: false,
        message: 'Interview round not found'
      });
    }
    
    round.status = status;
    round.completedDate = new Date();
    if (score !== undefined) round.score = score;
    if (feedback) round.feedback = feedback;
    
    // Update application status based on round result
    if (status === 'cleared') {
      const statusMap = {
        'aptitude': 'aptitude_cleared',
        'technical': 'technical_cleared',
        'hr': 'hr_cleared'
      };
      if (statusMap[round.roundType]) {
        application.status = statusMap[round.roundType];
      }
    } else if (status === 'rejected') {
      const statusMap = {
        'aptitude': 'aptitude_rejected',
        'technical': 'technical_rejected',
        'hr': 'hr_rejected'
      };
      if (statusMap[round.roundType]) {
        application.status = statusMap[round.roundType];
      }
    }
    
    application.lastUpdatedBy = req.user._id;
    
    // Add notification
    application.notifications.push({
      type: 'interview_result',
      message: `${round.roundName} result: ${status}`,
      sentBy: req.user._id
    });
    
    await application.save();
    
    // Send email notification
    if (process.env.ENABLE_EMAIL === 'true') {
      await sendEmail({
        to: application.studentId.email,
        subject: `Interview Result - ${application.jobId.title}`,
        html: `
          <h2>Interview Result</h2>
          <p>Dear ${application.studentId.name},</p>
          <p>Your interview result for <strong>${round.roundName}</strong> is now available.</p>
          <p><strong>Company:</strong> ${application.jobId.company.name}</p>
          <p><strong>Position:</strong> ${application.jobId.title}</p>
          <p><strong>Result:</strong> ${status.toUpperCase()}</p>
          ${score ? `<p><strong>Score:</strong> ${score}</p>` : ''}
          ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
          <p>Best regards,<br>Placement Cell</p>
        `
      }).catch(err => console.error('Email error:', err));
    }
    
    res.json({
      success: true,
      message: 'Interview result updated successfully',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Mark as selected and send offer
exports.markAsSelected = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { offeredCTC, offeredRole, joiningDate, joiningLocation, offerLetterUrl } = req.body;
    
    const application = await Application.findOne({
      _id: applicationId,
      collegeId: req.user.college
    }).populate('studentId', 'name email').populate('jobId', 'title company');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update selection details
    application.status = 'offered';
    application.selectionDetails = {
      selectedDate: new Date(),
      selectedBy: req.user._id,
      offeredCTC,
      offeredRole,
      offerLetterSent: true,
      offerLetterDate: new Date(),
      offerLetterUrl,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      joiningLocation
    };
    
    application.lastUpdatedBy = req.user._id;
    
    // Add notification
    application.notifications.push({
      type: 'offer_made',
      message: `Offer made: ${offeredRole} at ${offeredCTC} LPA`,
      sentBy: req.user._id
    });
    
    await application.save();
    
    // Update student's placed status
    await User.findByIdAndUpdate(application.studentId._id, {
      isPlaced: true,
      placedCompany: application.jobId.company.name,
      placedRole: offeredRole,
      placedCTC: offeredCTC
    });
    
    // Send offer email
    if (process.env.ENABLE_EMAIL === 'true') {
      await sendEmail({
        to: application.studentId.email,
        subject: `Congratulations! Job Offer from ${application.jobId.company.name}`,
        html: `
          <h2>🎉 Congratulations!</h2>
          <p>Dear ${application.studentId.name},</p>
          <p>We are delighted to inform you that you have been selected for the position of <strong>${offeredRole}</strong> at <strong>${application.jobId.company.name}</strong>!</p>
          <p><strong>Package:</strong> ₹${offeredCTC} LPA</p>
          ${joiningDate ? `<p><strong>Tentative Joining Date:</strong> ${new Date(joiningDate).toLocaleDateString()}</p>` : ''}
          ${joiningLocation ? `<p><strong>Location:</strong> ${joiningLocation}</p>` : ''}
          ${offerLetterUrl ? `<p><a href="${offerLetterUrl}">Download Offer Letter</a></p>` : ''}
          <p>Please accept or decline this offer through the placement portal.</p>
          <p>Congratulations once again!<br>Placement Cell</p>
        `
      }).catch(err => console.error('Email error:', err));
    }
    
    res.json({
      success: true,
      message: 'Application marked as selected and offer sent',
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Student accepts/rejects offer
exports.respondToOffer = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { response } = req.body; // 'accept' or 'reject'
    
    const application = await Application.findOne({
      _id: applicationId,
      studentId: req.user._id
    }).populate('jobId', 'title company');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    if (application.status !== 'offered') {
      return res.status(400).json({
        success: false,
        message: 'No offer available to respond to'
      });
    }
    
    if (response === 'accept') {
      application.status = 'offer_accepted';
      application.notifications.push({
        type: 'offer_accepted',
        message: 'Student accepted the offer',
        sentBy: req.user._id
      });
    } else {
      application.status = 'offer_rejected';
      application.notifications.push({
        type: 'offer_rejected',
        message: 'Student rejected the offer',
        sentBy: req.user._id
      });
      
      // Update student's placed status
      await User.findByIdAndUpdate(req.user._id, {
        isPlaced: false,
        placedCompany: null,
        placedRole: null,
        placedCTC: null
      });
    }
    
    await application.save();
    
    res.json({
      success: true,
      message: `Offer ${response}ed successfully`,
      data: application
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get application workflow timeline
exports.getApplicationTimeline = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findOne({
      _id: applicationId,
      collegeId: req.user.college
    })
      .populate('studentId', 'name email rollNumber')
      .populate('jobId', 'title company')
      .populate('rounds.conductedBy', 'name role')
      .populate('notifications.sentBy', 'name role');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Build timeline
    const timeline = [
      {
        event: 'Application Submitted',
        date: application.appliedAt,
        status: 'completed'
      }
    ];
    
    // Add rounds to timeline
    application.rounds.forEach(round => {
      if (round.scheduledDate) {
        timeline.push({
          event: `${round.roundName} Scheduled`,
          date: round.scheduledDate,
          status: round.status,
          details: {
            interviewer: round.interviewerName,
            score: round.score,
            feedback: round.feedback
          }
        });
      }
      if (round.completedDate) {
        timeline.push({
          event: `${round.roundName} Completed`,
          date: round.completedDate,
          status: round.status,
          details: {
            score: round.score,
            feedback: round.feedback
          }
        });
      }
    });
    
    // Add selection/offer events
    if (application.selectionDetails && application.selectionDetails.selectedDate) {
      timeline.push({
        event: 'Selected',
        date: application.selectionDetails.selectedDate,
        status: 'completed',
        details: {
          role: application.selectionDetails.offeredRole,
          ctc: application.selectionDetails.offeredCTC
        }
      });
    }
    
    if (application.selectionDetails && application.selectionDetails.offerLetterDate) {
      timeline.push({
        event: 'Offer Letter Sent',
        date: application.selectionDetails.offerLetterDate,
        status: 'completed'
      });
    }
    
    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      success: true,
      data: {
        application,
        timeline
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get workflow statistics
exports.getWorkflowStatistics = async (req, res) => {
  try {
    const { jobId } = req.query;
    
    const query = { collegeId: req.user.college };
    if (jobId) query.jobId = jobId;
    
    const stats = await Application.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalApplications = await Application.countDocuments(query);
    
    // Calculate conversion rates
    const statusCounts = {};
    stats.forEach(s => {
      statusCounts[s._id] = s.count;
    });
    
    const conversionRates = {
      applicationToShortlist: statusCounts.shortlisted || 0,
      shortlistToSelected: statusCounts.selected || 0,
      selectedToOffered: statusCounts.offered || 0,
      offeredToAccepted: statusCounts.offer_accepted || 0,
      totalRejected: (statusCounts.rejected || 0) + 
                     (statusCounts.aptitude_rejected || 0) + 
                     (statusCounts.technical_rejected || 0) + 
                     (statusCounts.hr_rejected || 0)
    };
    
    res.json({
      success: true,
      data: {
        total: totalApplications,
        statusBreakdown: statusCounts,
        conversionRates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Module exports are defined inline using exports.functionName
