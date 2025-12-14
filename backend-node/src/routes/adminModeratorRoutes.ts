import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
    createModerator,
    listModerators,
    updateModerator,
    toggleModeratorStatus,
} from "../controllers/adminModerator.controller";

const router = Router();

// Apply auth to all routes
router.use(requireAuth);
// Only admins can manage moderators
router.use(requireRole(['admin', 'superadmin']));

router.post("/moderators", createModerator);
router.get("/moderators", listModerators);
router.put("/moderators/:id", updateModerator);
router.patch("/moderators/:id/status", toggleModeratorStatus);

export default router;
