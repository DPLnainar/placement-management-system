import { Router } from 'express';
import { protect, authorize } from '@middleware/auth';
import * as companyController from '@controllers/companyController';

const router = Router();

// All routes require authentication
router.use(protect);

// Admin/Moderator routes
router.post('/', 
  authorize(['admin', 'moderator']), 
  companyController.createCompany
);

router.get('/', 
  companyController.getCompanies
);

router.get('/statistics', 
  authorize(['admin', 'moderator']), 
  companyController.getCompanyStatistics
);

router.get('/:id', 
  companyController.getCompanyById
);

router.put('/:id', 
  authorize(['admin', 'moderator']), 
  companyController.updateCompany
);

router.delete('/:id', 
  authorize(['admin']), 
  companyController.deleteCompany
);

export default router;
