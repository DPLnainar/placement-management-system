const AuditLog = require('../models/AuditLog');

// Get audit logs with filters
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      action,
      user,
      status,
      severity,
      startDate,
      endDate,
      resourceType,
      isSuspicious,
      limit = 50,
      page = 1
    } = req.query;
    
    const query = { college: req.user.college };
    
    if (action) query.action = action;
    if (user) query.user = user;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (resourceType) query.resourceType = resourceType;
    if (isSuspicious !== undefined) query.isSuspicious = isSuspicious === 'true';
    
    // Date filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get recent activity
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = await AuditLog.getRecentLogs(req.user.college, limit);
    
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user activity
exports.getUserActivity = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = await AuditLog.getUserActivity(userId, limit);
    
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get suspicious activity
exports.getSuspiciousActivity = async (req, res) => {
  try {
    const logs = await AuditLog.getSuspiciousActivity(req.user.college);
    
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get activity statistics
exports.getActivityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await AuditLog.getActivityStats(req.user.college, startDate, endDate);
    
    // Get total counts
    const totalQuery = { college: req.user.college };
    if (startDate || endDate) {
      totalQuery.createdAt = {};
      if (startDate) totalQuery.createdAt.$gte = new Date(startDate);
      if (endDate) totalQuery.createdAt.$lte = new Date(endDate);
    }
    
    const totalLogs = await AuditLog.countDocuments(totalQuery);
    const successfulLogs = await AuditLog.countDocuments({ ...totalQuery, status: 'success' });
    const failedLogs = await AuditLog.countDocuments({ ...totalQuery, status: 'failure' });
    const suspiciousLogs = await AuditLog.countDocuments({ ...totalQuery, isSuspicious: true });
    
    // Get top users
    const topUsers = await AuditLog.aggregate([
      { $match: totalQuery },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          userName: { $first: '$userName' },
          userRole: { $first: '$userRole' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: {
          total: totalLogs,
          successful: successfulLogs,
          failed: failedLogs,
          suspicious: suspiciousLogs,
          successRate: totalLogs > 0 ? Math.round((successfulLogs / totalLogs) * 100) : 0
        },
        actionBreakdown: stats,
        topUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get login history
exports.getLoginHistory = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const query = {
      college: req.user.college,
      action: { $in: ['login', 'login_failed', 'logout'] }
    };
    
    if (userId) query.user = userId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete old logs (admin only)
exports.deleteOldLogs = async (req, res) => {
  try {
    const { beforeDate } = req.body;
    
    if (!beforeDate) {
      return res.status(400).json({
        success: false,
        message: 'beforeDate is required'
      });
    }
    
    const result = await AuditLog.deleteMany({
      college: req.user.college,
      createdAt: { $lt: new Date(beforeDate) }
    });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} audit logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
