import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as studentController from '../controllers/studentController';
import { uploadResume } from '../config/uploadConfig';
import multer from 'multer';

const router = Router();

// Photo upload with memory storage (multer-s3 incompatible with AWS SDK v3)
const uploadPhoto = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req: any, file: any, cb: any) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files allowed!'), false);
        }
        cb(null, true);
    },
});

/**
 * Student Routes
 */

router.use(authenticate);

// Profile
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);

// Uploads
router.post('/photo', uploadPhoto.single('photo'), studentController.uploadPhoto);
router.post('/resume/upload', uploadResume.single('resume'), studentController.uploadResume);

// Resume Generation
router.post('/resume/generate', studentController.generateResume);

// Jobs & Applications
router.get('/jobs', studentController.getStudentJobsWithEligibility);
router.get('/jobs/eligible', studentController.getEligibleJobs);
router.get('/applications', studentController.getApplications);

// Placement Card
router.get('/placement-card', studentController.getPlacementCard);

// Notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);
router.put('/notifications/read-all', studentController.markAllNotificationsRead);

// Profile Deletion Request
router.post('/profile-deletion-request', studentController.requestProfileDeletion);

// Offers Management
router.get('/offers', studentController.getOffers);
router.post('/offers/:offerId/accept', studentController.acceptOffer);

export default router;
