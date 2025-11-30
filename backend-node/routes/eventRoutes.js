const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// Public routes (authenticated users)
router.use(protect);

// Student routes
router.get('/calendar', eventController.getStudentCalendar);
router.get('/upcoming', eventController.getUpcomingEventsSummary);
router.post('/:id/register', eventController.registerForEvent);
router.post('/:id/cancel-registration', eventController.cancelRegistration);

// Admin/Moderator routes
router.post('/', authorize('admin', 'moderator'), eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', authorize('admin', 'moderator'), eventController.updateEvent);
router.delete('/:id', authorize('admin', 'moderator'), eventController.deleteEvent);
router.post('/:id/attendance', authorize('admin', 'moderator'), eventController.markAttendance);
router.get('/:id/statistics', authorize('admin', 'moderator'), eventController.getEventStatistics);

module.exports = router;
