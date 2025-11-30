const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  uploadResume,
  uploadPhoto,
  uploadLogo,
  uploadDocument
} = require('../config/fileUpload');
const uploadController = require('../controllers/uploadController');

/**
 * File Upload Routes
 * All routes require authentication
 */

// Resume upload
router.post('/resume',
  authenticate,
  uploadResume.single('resume'),
  uploadController.uploadResume
);

// Profile photo upload
router.post('/photo',
  authenticate,
  uploadPhoto.single('photo'),
  uploadController.uploadProfilePhoto
);

// Additional document upload
router.post('/document',
  authenticate,
  uploadDocument.single('document'),
  uploadController.uploadDocument
);

// Get user's files
router.get('/files',
  authenticate,
  uploadController.getUserFiles
);

// Delete resume
router.delete('/resume',
  authenticate,
  uploadController.deleteResume
);

// Delete document
router.delete('/document/:documentId',
  authenticate,
  uploadController.deleteDocument
);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum allowed size varies by file type.'
      });
    }
    
    if (error.message) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  next(error);
});

module.exports = router;
