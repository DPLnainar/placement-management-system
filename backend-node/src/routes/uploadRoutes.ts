import { Router } from 'express';
import { previewPdf } from '../controllers/uploadController';

const router = Router();

/**
 * Upload Routes
 * File upload handling with Cloudinary
 */

// PDF Preview endpoint (no auth required for viewing uploaded PDFs)
router.get('/preview-pdf', previewPdf);

// Authenticated routes would go here
// router.use(authenticate);
// router.post('/resume', uploadResume);
// router.post('/profile-photo', uploadProfilePhoto);
// router.post('/document', uploadDocument);

export default router;
