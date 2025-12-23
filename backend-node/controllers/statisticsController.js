const StudentData = require('../models/StudentData');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

/**
 * Get Placement Statistics Dashboard
 * 
 * Comprehensive placement statistics for college
 * ADMIN/MODERATOR only
 */
exports.getPlacementStatistics = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { year, branch } = req.query;

    // Build filter
    const filter = { collegeId };
    if (year) filter['education.graduation.currentYear'] = parseInt(year);
    if (branch) filter['education.graduation.branch'] = branch;

    // Total students
    const totalStudents = await StudentData.countDocuments(filter);

    // Placement status breakdown
    const placedStudents = await StudentData.countDocuments({ ...filter, placementStatus: 'placed' });
    const notPlacedStudents = await StudentData.countDocuments({ ...filter, placementStatus: 'not_placed' });
    const eligibleStudents = await StudentData.countDocuments({ ...filter, placementStatus: 'eligible' });
    const optedOutStudents = await StudentData.countDocuments({ ...filter, placementStatus: 'opted_out' });
    const barredStudents = await StudentData.countDocuments({ ...filter, placementStatus: 'barred' });

    // Calculate placement percentage
    const placementPercentage = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : 0;

    // Average package calculation
    const placedStudentsWithPackage = await StudentData.find({
      ...filter,
      placementStatus: 'placed',
      'offerDetails.ctc': { $exists: true, $ne: null }
    })
      .select('offerDetails.ctc')
      .lean(); // Faster for read-only

    const packages = placedStudentsWithPackage.map(s => s.offerDetails.ctc);
    const averagePackage = packages.length > 0
      ? (packages.reduce((sum, ctc) => sum + ctc, 0) / packages.length).toFixed(2)
      : 0;
    const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
    const lowestPackage = packages.length > 0 ? Math.min(...packages) : 0;

    // Company-wise placements
    const companyStats = await StudentData.aggregate([
      { $match: { ...filter, placementStatus: 'placed', placedCompany: { $ne: null } } },
      { $group: { _id: '$placedCompany', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Branch-wise statistics
    const branchStats = await StudentData.aggregate([
      { $match: { collegeId, placementStatus: 'placed' } },
      {
        $group: {
          _id: '$education.graduation.branch',
          placed: { $sum: 1 }
        }
      },
      { $sort: { placed: -1 } }
    ]);

    // Get total students per branch for percentage
    const branchTotals = await StudentData.aggregate([
      { $match: { collegeId } },
      {
        $group: {
          _id: '$education.graduation.branch',
          total: { $sum: 1 }
        }
      }
    ]);

    const branchData = branchStats.map(stat => {
      const total = branchTotals.find(t => t._id === stat._id);
      return {
        branch: stat._id || 'Not Specified',
        placed: stat.placed,
        total: total?.total || stat.placed,
        percentage: total?.total ? ((stat.placed / total.total) * 100).toFixed(2) : 100
      };
    });

    // Placement type breakdown
    const dreamPlacements = await StudentData.countDocuments({ ...filter, placementType: 'dream' });
    const superDreamPlacements = await StudentData.countDocuments({ ...filter, placementType: 'super_dream' });
    const normalPlacements = await StudentData.countDocuments({ ...filter, placementType: 'normal' });
    const internshipPlacements = await StudentData.countDocuments({ ...filter, placementType: 'internship' });
    const ppoPlacements = await StudentData.countDocuments({ ...filter, placementType: 'ppo' });

    // Multiple offers statistics
    const studentsWithMultipleOffers = await StudentData.countDocuments({
      ...filter,
      'allOffers.1': { $exists: true }
    });

    // Recent placements (last 10)
    const recentPlacements = await StudentData.find({
      ...filter,
      placementStatus: 'placed',
      placementDate: { $ne: null }
    })
      .sort({ placementDate: -1 })
      .limit(10)
      .populate('userId', 'fullName email')
      .select('userId placedCompany offerDetails.ctc placementDate placementType')
      .lean(); // Faster for read-only

    // Active jobs count
    const activeJobs = await Job.countDocuments({ collegeId, status: 'active' });
    const totalJobs = await Job.countDocuments({ collegeId });

    // Application statistics
    const totalApplications = await Application.countDocuments({ collegeId });
    const pendingApplications = await Application.countDocuments({ collegeId, status: 'pending' });
    const approvedApplications = await Application.countDocuments({ collegeId, status: 'approved' });

    res.json({
      success: true,
      statistics: {
        overview: {
          totalStudents,
          placedStudents,
          notPlacedStudents,
          eligibleStudents,
          optedOutStudents,
          barredStudents,
          placementPercentage: parseFloat(placementPercentage)
        },
        packages: {
          averagePackage: parseFloat(averagePackage),
          highestPackage,
          lowestPackage,
          totalOffersWithPackage: packages.length
        },
        placementTypes: {
          superDream: superDreamPlacements,
          dream: dreamPlacements,
          normal: normalPlacements,
          internship: internshipPlacements,
          ppo: ppoPlacements
        },
        topCompanies: companyStats.map(c => ({
          company: c._id,
          placements: c.count
        })),
        branchWise: branchData,
        multipleOffers: studentsWithMultipleOffers,
        recentPlacements: recentPlacements.map(p => ({
          studentName: p.userId?.fullName || 'N/A',
          company: p.placedCompany,
          package: p.offerDetails?.ctc,
          date: p.placementDate,
          type: p.placementType
        })),
        jobs: {
          active: activeJobs,
          total: totalJobs
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications
        }
      }
    });

  } catch (error) {
    console.error('Get placement statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching placement statistics'
    });
  }
};

/**
 * Get Year-wise Placement Trends
 */
exports.getPlacementTrends = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { startYear, endYear } = req.query;

    const matchStage = { collegeId, placementStatus: 'placed', placementDate: { $ne: null } };

    if (startYear || endYear) {
      matchStage.placementDate = {};
      if (startYear) matchStage.placementDate.$gte = new Date(`${startYear}-01-01`);
      if (endYear) matchStage.placementDate.$lte = new Date(`${endYear}-12-31`);
    }

    const trends = await StudentData.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $year: '$placementDate' },
          placements: { $sum: 1 },
          averagePackage: { $avg: '$offerDetails.ctc' },
          highestPackage: { $max: '$offerDetails.ctc' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      trends: trends.map(t => ({
        year: t._id,
        placements: t.placements,
        averagePackage: t.averagePackage ? t.averagePackage.toFixed(2) : 0,
        highestPackage: t.highestPackage || 0
      }))
    });

  } catch (error) {
    console.error('Get placement trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching placement trends'
    });
  }
};

/**
 * Get Student-wise Statistics
 */
exports.getStudentStatistics = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    // CGPA distribution
    const cgpaDistribution = await StudentData.aggregate([
      { $match: { collegeId, cgpa: { $ne: null } } },
      {
        $bucket: {
          groupBy: '$cgpa',
          boundaries: [0, 6, 7, 8, 9, 10],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Profile completion distribution
    const profileCompletion = await StudentData.aggregate([
      { $match: { collegeId } },
      {
        $bucket: {
          groupBy: '$profileCompletionPercentage',
          boundaries: [0, 25, 50, 75, 90, 100],
          default: 'Incomplete',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Documents verification status
    const verifiedStudents = await StudentData.countDocuments({ collegeId, documentsVerified: true });
    const unverifiedStudents = await StudentData.countDocuments({ collegeId, documentsVerified: false });

    res.json({
      success: true,
      statistics: {
        cgpaDistribution: cgpaDistribution.map(d => ({
          range: `${d._id}-${d._id + 1}`,
          count: d.count
        })),
        profileCompletion: profileCompletion.map(p => ({
          range: `${p._id}-${p._id + (p._id < 90 ? 25 : 10)}%`,
          count: p.count
        })),
        verification: {
          verified: verifiedStudents,
          unverified: unverifiedStudents
        }
      }
    });

  } catch (error) {
    console.error('Get student statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student statistics'
    });
  }
};

/**
 * Get Company Statistics
 */
exports.getCompanyStatistics = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    // Companies that visited
    const companiesVisited = await Job.distinct('company', { collegeId });

    // Companies with placements
    const companiesWithPlacements = await StudentData.distinct('placedCompany', {
      collegeId,
      placementStatus: 'placed'
    });

    // Average package by company
    const companyPackages = await StudentData.aggregate([
      {
        $match: {
          collegeId,
          placementStatus: 'placed',
          placedCompany: { $ne: null },
          'offerDetails.ctc': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$placedCompany',
          averagePackage: { $avg: '$offerDetails.ctc' },
          highestPackage: { $max: '$offerDetails.ctc' },
          totalHires: { $sum: 1 }
        }
      },
      { $sort: { totalHires: -1 } }
    ]);

    res.json({
      success: true,
      statistics: {
        totalCompaniesVisited: companiesVisited.length,
        companiesWithPlacements: companiesWithPlacements.length,
        conversionRate: companiesVisited.length > 0
          ? ((companiesWithPlacements.length / companiesVisited.length) * 100).toFixed(2)
          : 0,
        companyDetails: companyPackages.map(c => ({
          company: c._id,
          averagePackage: c.averagePackage.toFixed(2),
          highestPackage: c.highestPackage,
          totalHires: c.totalHires
        }))
      }
    });

  } catch (error) {
    console.error('Get company statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company statistics'
    });
  }
};

/**
 * Export Placement Report
 */
exports.exportPlacementReport = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { format, year, branch } = req.query;

    const filter = { collegeId, placementStatus: 'placed' };
    if (year) filter['education.graduation.currentYear'] = parseInt(year);
    if (branch) filter['education.graduation.branch'] = branch;

    const placements = await StudentData.find(filter)
      .populate('userId', 'fullName email username')
      .select('userId education placedCompany offerDetails placementDate placementType')
      .sort({ placementDate: -1 });

    const reportData = placements.map(p => ({
      studentName: p.userId?.fullName || 'N/A',
      email: p.userId?.email || 'N/A',
      rollNumber: p.education?.graduation?.rollNumber || 'N/A',
      branch: p.education?.graduation?.branch || 'N/A',
      cgpa: p.education?.graduation?.cgpa || 'N/A',
      company: p.placedCompany,
      package: p.offerDetails?.ctc || 'N/A',
      joiningDate: p.offerDetails?.joiningDate || 'N/A',
      placementDate: p.placementDate,
      placementType: p.placementType
    }));

    // For now, return JSON (can be enhanced to generate CSV/Excel)
    res.json({
      success: true,
      message: 'Placement report generated',
      format: format || 'json',
      totalRecords: reportData.length,
      data: reportData
    });

  } catch (error) {
    console.error('Export placement report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting placement report'
    });
  }
};

// Module exports are defined inline using exports.functionName
// No need for module.exports = {} at the end
