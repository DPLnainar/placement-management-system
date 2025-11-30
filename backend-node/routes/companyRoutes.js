const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const companyController = require('../controllers/companyController');

// All routes require authentication
router.use(protect);

// Admin/Moderator routes
router.post('/', 
  authorize('admin', 'moderator'), 
  companyController.createCompany
);

router.get('/', 
  companyController.getCompanies
);

router.get('/statistics', 
  authorize('admin', 'moderator'), 
  companyController.getCompanyStatistics
);

router.get('/:id', 
  companyController.getCompanyById
);

router.put('/:id', 
  authorize('admin', 'moderator'), 
  companyController.updateCompany
);

router.delete('/:id', 
  authorize('admin'), 
  companyController.deleteCompany
);

// Student routes
router.post('/:companyId/review', 
  authorize('student'), 
  companyController.addCompanyReview
);

// Company portal routes (would need separate auth middleware)
// router.get('/portal/dashboard', companyController.getCompanyDashboard);

module.exports = router;
