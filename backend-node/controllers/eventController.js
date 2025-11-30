const Event = require('../models/Event');
const User = require('../models/User');
const Job = require('../models/Job');
const PlacementDrive = require('../models/PlacementDrive');

// Create event
exports.createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      college: req.user.college,
      createdBy: req.user._id
    };
    
    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all events with filters
exports.getEvents = async (req, res) => {
  try {
    const {
      eventType,
      status,
      startDate,
      endDate,
      isPublished,
      relatedJob,
      relatedDrive,
      upcoming,
      past
    } = req.query;
    
    const query = { college: req.user.college };
    
    if (eventType) query.eventType = eventType;
    if (status) query.status = status;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (relatedJob) query.relatedJob = relatedJob;
    if (relatedDrive) query.relatedDrive = relatedDrive;
    
    // Date filters
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    // Upcoming events (next 30 days)
    if (upcoming === 'true') {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      query.startDate = { $gte: now, $lte: thirtyDaysFromNow };
      query.status = 'scheduled';
    }
    
    // Past events
    if (past === 'true') {
      query.endDate = { $lt: new Date() };
    }
    
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .populate('organizers', 'name email')
      .populate('relatedJob', 'title company')
      .populate('relatedDrive', 'title company')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get student's calendar (eligible events)
exports.getStudentCalendar = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {
      college: req.user.college,
      isPublished: true,
      status: { $in: ['scheduled', 'ongoing'] }
    };
    
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    const allEvents = await Event.find(query)
      .populate('relatedJob', 'title company')
      .populate('relatedDrive', 'title company')
      .sort({ startDate: 1 });
    
    // Get student data
    const student = await User.findById(req.user._id);
    
    // Filter events based on eligibility
    const eligibleEvents = allEvents.filter(event => event.isStudentEligible(student));
    
    // Add registration status
    const eventsWithStatus = eligibleEvents.map(event => {
      const eventObj = event.toObject();
      eventObj.isRegistered = event.isStudentRegistered(req.user._id);
      eventObj.registrationStatus = event.getRegistrationStatus(req.user._id);
      eventObj.canRegister = event.canRegister();
      return eventObj;
    });
    
    res.json({
      success: true,
      count: eventsWithStatus.length,
      data: eventsWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single event
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      college: req.user.college
    })
      .populate('createdBy', 'name email')
      .populate('organizers', 'name email')
      .populate('relatedJob', 'title company eligibilityCriteria')
      .populate('relatedDrive', 'title company')
      .populate('registeredStudents.student', 'name email rollNumber branch year');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // If student, check eligibility
    if (req.user.role === 'student') {
      const student = await User.findById(req.user._id);
      const eventObj = event.toObject();
      eventObj.isEligible = event.isStudentEligible(student);
      eventObj.isRegistered = event.isStudentRegistered(req.user._id);
      eventObj.registrationStatus = event.getRegistrationStatus(req.user._id);
      eventObj.canRegister = event.canRegister();
      
      return res.json({
        success: true,
        data: eventObj
      });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      college: req.user.college
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Track update
    if (req.body.notes) {
      event.updates.push({
        message: req.body.notes,
        updatedBy: req.user._id
      });
    }
    
    Object.assign(event, req.body);
    event.lastModifiedBy = req.user._id;
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      college: req.user.college
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Register for event (student)
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      college: req.user.college,
      isPublished: true
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    if (!event.canRegister()) {
      return res.status(400).json({
        success: false,
        message: 'Registration is not available for this event'
      });
    }
    
    // Check eligibility
    const student = await User.findById(req.user._id);
    if (!event.isStudentEligible(student)) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible for this event'
      });
    }
    
    // Check if already registered
    if (event.isStudentRegistered(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }
    
    // Register
    event.registeredStudents.push({
      student: req.user._id,
      status: 'registered'
    });
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Successfully registered for the event',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel registration (student)
exports.cancelRegistration = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      college: req.user.college
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const registration = event.registeredStudents.find(
      r => r.student.toString() === req.user._id.toString()
    );
    
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }
    
    // Update status to cancelled
    registration.status = 'cancelled';
    await event.save();
    
    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark attendance (admin/moderator)
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, status } = req.body;
    
    const event = await Event.findOne({
      _id: req.params.id,
      college: req.user.college
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const registration = event.registeredStudents.find(
      r => r.student.toString() === studentId
    );
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Student not registered for this event'
      });
    }
    
    registration.status = status;
    await event.save();
    
    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get event statistics
exports.getEventStatistics = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      college: req.user.college
    }).populate('registeredStudents.student', 'name email branch year');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const stats = {
      totalRegistered: event.registeredStudents.length,
      capacity: event.capacity,
      availableSlots: event.capacity ? event.capacity - event.registeredStudents.length : null,
      statusBreakdown: {
        registered: event.registeredStudents.filter(r => r.status === 'registered').length,
        confirmed: event.registeredStudents.filter(r => r.status === 'confirmed').length,
        attended: event.registeredStudents.filter(r => r.status === 'attended').length,
        absent: event.registeredStudents.filter(r => r.status === 'absent').length,
        cancelled: event.registeredStudents.filter(r => r.status === 'cancelled').length
      },
      attendanceRate: event.attendanceRate,
      branchWise: {},
      yearWise: {}
    };
    
    // Branch-wise breakdown
    event.registeredStudents.forEach(reg => {
      if (reg.student && reg.student.branch) {
        stats.branchWise[reg.student.branch] = (stats.branchWise[reg.student.branch] || 0) + 1;
      }
    });
    
    // Year-wise breakdown
    event.registeredStudents.forEach(reg => {
      if (reg.student && reg.student.year) {
        stats.yearWise[reg.student.year] = (stats.yearWise[reg.student.year] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get upcoming events summary
exports.getUpcomingEventsSummary = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = await Event.find({
      college: req.user.college,
      isPublished: true,
      status: 'scheduled',
      startDate: { $gte: now, $lte: sevenDaysFromNow }
    })
      .populate('relatedJob', 'title company')
      .populate('relatedDrive', 'title')
      .sort({ startDate: 1 })
      .limit(10);
    
    res.json({
      success: true,
      count: upcomingEvents.length,
      data: upcomingEvents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
