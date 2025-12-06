import express from 'express';
import {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    generatePresignedUrl,
    uploadResume,
    uploadProfilePicture,
    uploadCompanyLogo,
} from '../controllers/s3UploadController';
import {
    s3Upload,
    resumeUpload,
    imageUpload,
} from '../middleware/s3Multer';
// Import your auth middleware
// import { protect } from '../middleware/auth';

const router = express.Router();

// General file upload routes
router.post('/upload', s3Upload.single('file'), uploadFile);
router.post('/upload-multiple', s3Upload.array('files', 10), uploadMultipleFiles);
router.delete('/delete', deleteFile);
router.post('/presigned-url', generatePresignedUrl);

// Specific upload routes
router.post('/upload-resume', resumeUpload.single('resume'), uploadResume);
router.post('/upload-profile-picture', imageUpload.single('profilePicture'), uploadProfilePicture);
router.post('/upload-company-logo', imageUpload.single('logo'), uploadCompanyLogo);

// Protected routes (uncomment and add auth middleware as needed)
// router.post('/upload', protect, s3Upload.single('file'), uploadFile);
// router.post('/upload-multiple', protect, s3Upload.array('files', 10), uploadMultipleFiles);
// router.delete('/delete', protect, deleteFile);
// router.post('/presigned-url', protect, generatePresignedUrl);
// router.post('/upload-resume', protect, resumeUpload.single('resume'), uploadResume);
// router.post('/upload-profile-picture', protect, imageUpload.single('profilePicture'), uploadProfilePicture);
// router.post('/upload-company-logo', protect, imageUpload.single('logo'), uploadCompanyLogo);

export default router;
