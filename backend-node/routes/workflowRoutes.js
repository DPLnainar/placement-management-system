const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const workflowController = require('../controllers/workflowController');

// All routes require authentication
router.use(protect);

// Admin/Moderator routes for workflow management
router.put('/:applicationId/move-stage', 
  authorize('admin', 'moderator'), 
  workflowController.moveToNextStage
);

router.put('/bulk-update', 
  authorize('admin', 'moderator'), 
  workflowController.bulkUpdateStatus
);

router.post('/:applicationId/schedule-interview', 
  authorize('admin', 'moderator'), 
  workflowController.scheduleInterview
);

router.put('/:applicationId/rounds/:roundId/result', 
  authorize('admin', 'moderator'), 
  workflowController.updateInterviewResult
);

router.post('/:applicationId/mark-selected', 
  authorize('admin', 'moderator'), 
  workflowController.markAsSelected
);

// Student routes
router.post('/:applicationId/respond-offer', 
  workflowController.respondToOffer
);

// View routes (accessible to all authenticated users)
router.get('/:applicationId/timeline', 
  workflowController.getApplicationTimeline
);

router.get('/statistics', 
  authorize('admin', 'moderator'), 
  workflowController.getWorkflowStatistics
);

module.exports = router;
