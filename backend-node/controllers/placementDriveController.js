const PlacementDrive = require('../models/PlacementDrive');
const Job = require('../models/Job');
const Application = require('../models/Application');
const StudentData = require('../models/StudentData');

/**
 * Placement Drive Controller
 * Manages placement seasons, campaigns, and drive-wide policies
 */

/**
 * Create new placement drive (Admin only)
 */
exports.createDrive = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const {
      name,
      academicYear,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      driveType,
      policies,
      targets,
      description,
      guidelines
    } = req.body;

    // Validate required fields
    if (!name || !academicYear || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, academic year, start date, and end date are required'
      });
    }

    // Create placement drive
    const drive = new PlacementDrive({
      name,
      academicYear,
      collegeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationStartDate: registrationStartDate ? new Date(registrationStartDate) : null,
      registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null,
      driveType: driveType || 'main_placement',
      policies: policies || {},
      targets: targets || {},
      description,
      guidelines,
      createdBy: req.user._id,
      coordinators: [{
        userId: req.user._id,
        role: 'primary'
      }]
    });

    await drive.save();

    res.status(201).json({
      success: true,
      message: 'Placement drive created successfully',
      data: drive
    });
  } catch (error) {
    console.error('Create drive error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating placement drive'
    });
  }
};

/**
 * Get all drives for college
 */
exports.getDrives = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { status, academicYear } = req.query;

    const query = { collegeId };
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    const drives = await PlacementDrive.find(query)
      .populate('createdBy', 'username fullName')
      .populate('coordinators.userId', 'username fullName role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: drives
    });
  } catch (error) {
    console.error('Get drives error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching placement drives'
    });
  }
};

/**
 * Get active drive
 */
exports.getActiveDrive = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const now = new Date();

    const activeDrive = await PlacementDrive.findOne({
      collegeId,
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      isFrozen: false
    })
    .populate('createdBy', 'username fullName')
    .populate('coordinators.userId', 'username fullName role');

    if (!activeDrive) {
      return res.status(404).json({
        success: false,
        message: 'No active placement drive found'
      });
    }

    res.json({
      success: true,
      data: activeDrive
    });
  } catch (error) {
    console.error('Get active drive error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active drive'
    });
  }
};

/**
 * Update drive
 */
exports.updateDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const updates = req.body;

    const drive = await PlacementDrive.findOne({ _id: id, collegeId });
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found'
      });
    }

    // Allowed updates
    const allowedUpdates = [
      'name', 'startDate', 'endDate', 'registrationStartDate', 'registrationEndDate',
      'status', 'driveType', 'policies', 'targets', 'description', 'guidelines'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        drive[key] = updates[key];
      }
    });

    await drive.save();

    res.json({
      success: true,
      message: 'Placement drive updated successfully',
      data: drive
    });
  } catch (error) {
    console.error('Update drive error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating placement drive'
    });
  }
};

/**
 * Update drive statistics
 */
exports.updateDriveStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    const drive = await PlacementDrive.findOne({ _id: id, collegeId });
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found'
      });
    }

    await drive.updateStatistics();

    res.json({
      success: true,
      message: 'Statistics updated successfully',
      data: drive.statistics
    });
  } catch (error) {
    console.error('Update statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating statistics'
    });
  }
};

/**
 * Add announcement to drive
 */
exports.addAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { title, message, priority, targetAudience } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const drive = await PlacementDrive.findOne({ _id: id, collegeId });
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found'
      });
    }

    drive.announcements.push({
      title,
      message,
      createdBy: req.user._id,
      priority: priority || 'normal',
      targetAudience: targetAudience || 'all'
    });

    await drive.save();

    res.json({
      success: true,
      message: 'Announcement added successfully',
      data: drive.announcements[drive.announcements.length - 1]
    });
  } catch (error) {
    console.error('Add announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding announcement'
    });
  }
};

/**
 * Get drive dashboard/analytics
 */
exports.getDriveDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    const drive = await PlacementDrive.findOne({ _id: id, collegeId });
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found'
      });
    }

    // Get jobs for this drive
    const jobs = await Job.find({
      collegeId,
      createdAt: { $gte: drive.startDate, $lte: drive.endDate }
    });

    // Get applications
    const applications = await Application.find({
      jobId: { $in: jobs.map(j => j._id) }
    });

    // Get placed students
    const placedStudents = await StudentData.find({
      collegeId,
      placementStatus: 'placed',
      placementDate: { $gte: drive.startDate, $lte: drive.endDate }
    }).populate('userId', 'username fullName email');

    // Company-wise statistics
    const companyStats = {};
    jobs.forEach(job => {
      if (!companyStats[job.company]) {
        companyStats[job.company] = {
          company: job.company,
          jobsPosted: 0,
          applications: 0,
          selected: 0,
          tier: job.companyTier
        };
      }
      companyStats[job.company].jobsPosted++;
      
      const jobApps = applications.filter(app => app.jobId.toString() === job._id.toString());
      companyStats[job.company].applications += jobApps.length;
      companyStats[job.company].selected += jobApps.filter(app => app.status === 'selected').length;
    });

    // Branch-wise statistics
    const branchStats = {};
    placedStudents.forEach(student => {
      if (!branchStats[student.branch]) {
        branchStats[student.branch] = {
          branch: student.branch,
          eligible: 0,
          placed: 0,
          percentage: 0
        };
      }
      branchStats[student.branch].placed++;
    });

    // Add eligible count
    const allStudents = await StudentData.find({
      collegeId,
      placementStatus: { $in: ['eligible', 'not_placed', 'placed'] }
    });
    
    allStudents.forEach(student => {
      if (branchStats[student.branch]) {
        branchStats[student.branch].eligible++;
      }
    });

    // Calculate percentages
    Object.values(branchStats).forEach(stat => {
      if (stat.eligible > 0) {
        stat.percentage = (stat.placed / stat.eligible) * 100;
      }
    });

    res.json({
      success: true,
      data: {
        drive: drive,
        summary: {
          totalJobs: jobs.length,
          totalApplications: applications.length,
          totalPlaced: placedStudents.length,
          placementPercentage: drive.statistics.placementPercentage,
          averageCTC: drive.statistics.averageCTC,
          highestCTC: drive.statistics.highestCTC
        },
        companyWise: Object.values(companyStats),
        branchWise: Object.values(branchStats),
        recentPlacements: placedStudents.slice(0, 10),
        upcomingJobs: jobs.filter(j => j.deadline > new Date()).slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get drive dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching drive dashboard'
    });
  }
};

/**
 * Freeze/Unfreeze drive (Emergency control)
 */
exports.toggleFreeze = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    const drive = await PlacementDrive.findOne({ _id: id, collegeId });
    if (!drive) {
      return res.status(404).json({
        success: false,
        message: 'Placement drive not found'
      });
    }

    drive.isFrozen = !drive.isFrozen;
    if (drive.isFrozen) {
      drive.freezeReason = reason || 'Administrative freeze';
      drive.freezeDate = new Date();
    } else {
      drive.freezeReason = null;
      drive.freezeDate = null;
    }

    await drive.save();

    res.json({
      success: true,
      message: `Drive ${drive.isFrozen ? 'frozen' : 'unfrozen'} successfully`,
      data: {
        isFrozen: drive.isFrozen,
        freezeReason: drive.freezeReason,
        freezeDate: drive.freezeDate
      }
    });
  } catch (error) {
    console.error('Toggle freeze error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling drive freeze'
    });
  }
};

module.exports = {
  createDrive: exports.createDrive,
  getDrives: exports.getDrives,
  getActiveDrive: exports.getActiveDrive,
  updateDrive: exports.updateDrive,
  updateDriveStatistics: exports.updateDriveStatistics,
  addAnnouncement: exports.addAnnouncement,
  getDriveDashboard: exports.getDriveDashboard,
  toggleFreeze: exports.toggleFreeze
};
