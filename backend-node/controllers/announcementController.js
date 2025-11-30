const Announcement = require('../models/Announcement');
const StudentData = require('../models/StudentData');
const { sendEmail } = require('../utils/notificationService');

/**
 * Create Announcement
 * ADMIN/MODERATOR only
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      collegeId: req.user.collegeId._id || req.user.collegeId,
      createdBy: req.user._id
    };

    const announcement = new Announcement(announcementData);
    await announcement.save();

    // Send email notifications if requested
    if (announcement.sendEmailNotification && announcement.isPublished) {
      // This would be handled by a background job in production
      // For now, just mark it as pending
      console.log(`📧 Email notification queued for announcement: ${announcement.title}`);
    }

    await announcement.populate('createdBy', 'fullName username');

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating announcement'
    });
  }
};

/**
 * Get All Announcements
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const { type, priority, isPublished, includeExpired } = req.query;

    const filter = { collegeId };
    
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    // Exclude expired announcements by default
    if (!includeExpired) {
      filter.$or = [
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ];
    }

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'fullName username role')
      .sort({ isPinned: -1, createdAt: -1 });

    // Add user-specific view status if student
    const enrichedAnnouncements = announcements.map(ann => {
      const obj = ann.toObject();
      obj.hasViewed = ann.hasUserViewed(req.user._id);
      obj.isActive = ann.isActive();
      return obj;
    });

    res.json({
      success: true,
      count: enrichedAnnouncements.length,
      announcements: enrichedAnnouncements
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements'
    });
  }
};

/**
 * Get Single Announcement
 */
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    const announcement = await Announcement.findOne({ _id: id, collegeId })
      .populate('createdBy', 'fullName username role')
      .populate('relatedJobId', 'title company')
      .populate('relatedDriveId', 'title');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Mark as viewed by student
    if (req.user.role === 'student') {
      await announcement.markAsViewed(req.user._id);
    }

    res.json({
      success: true,
      announcement: {
        ...announcement.toObject(),
        hasViewed: announcement.hasUserViewed(req.user._id),
        isActive: announcement.isActive()
      }
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching announcement'
    });
  }
};

/**
 * Update Announcement
 * ADMIN/MODERATOR only
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    const announcement = await Announcement.findOne({ _id: id, collegeId });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'collegeId' && key !== 'createdBy') {
        announcement[key] = req.body[key];
      }
    });

    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating announcement'
    });
  }
};

/**
 * Delete Announcement
 * ADMIN only
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    const announcement = await Announcement.findOneAndDelete({ _id: id, collegeId });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting announcement'
    });
  }
};

/**
 * Publish/Unpublish Announcement
 */
exports.togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    const announcement = await Announcement.findOne({ _id: id, collegeId });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.isPublished = !announcement.isPublished;
    if (announcement.isPublished && !announcement.publishDate) {
      announcement.publishDate = new Date();
    }

    await announcement.save();

    res.json({
      success: true,
      message: `Announcement ${announcement.isPublished ? 'published' : 'unpublished'} successfully`,
      announcement
    });

  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling announcement status'
    });
  }
};

/**
 * Pin/Unpin Announcement
 */
exports.togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId._id || req.user.collegeId;

    const announcement = await Announcement.findOne({ _id: id, collegeId });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    res.json({
      success: true,
      message: `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`,
      announcement
    });

  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling pin status'
    });
  }
};

/**
 * Get Unread Announcements Count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const collegeId = req.user.collegeId._id || req.user.collegeId;
    const userId = req.user._id;

    const announcements = await Announcement.find({
      collegeId,
      isPublished: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    });

    const unreadCount = announcements.filter(ann => !ann.hasUserViewed(userId)).length;

    res.json({
      success: true,
      unreadCount,
      totalActive: announcements.length
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
};

// Module exports are defined inline using exports.functionName
