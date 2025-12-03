import { Router } from 'express';
// import { authenticate, requireRole } from '@middleware/auth';

const router = Router();

/**
 * Placement Drive Routes
 * Temporarily disabled until placementDriveController is migrated
 */

// router.use(authenticate);

// Admin/Moderator: Manage placement drives
// router.post('/', requireRole(['admin', 'moderator']), createPlacementDrive);
// router.get('/', getPlacementDrives);
// router.get('/:id', getPlacementDriveById);
// router.put('/:id', requireRole(['admin', 'moderator']), updatePlacementDrive);
// router.delete('/:id', requireRole(['admin']), deletePlacementDrive);

export default router;
