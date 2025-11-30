const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

// All routes require authentication
router.use(protect);

// Advanced job search
router.get('/jobs', searchController.searchJobs);

// Get recommended jobs (students only)
router.get('/jobs/recommended', searchController.getRecommendedJobs);

// Get available filters
router.get('/jobs/filters', searchController.getJobFilters);

module.exports = router;
