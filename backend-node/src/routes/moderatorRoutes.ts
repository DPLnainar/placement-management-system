import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
    getJobsForModerator,
    getJobStudentsForModerator,
    blockStudent,
    unblockStudent,
    deleteStudent,
    getStudentsForModerator,
    unlockStudentPersonalInfo,
    unlockStudentAcademicInfo,
    lockStudentPersonalInfo,
    lockStudentAcademicInfo
} from "../controllers/moderatorController";

const router = Router();

// Apply auth to all routes
router.use(requireAuth);
// Only moderators can access these routes
router.use(requireRole(['moderator']));

router.get("/jobs", getJobsForModerator);
router.get("/jobs/:jobId/students", getJobStudentsForModerator);

// Student management routes
router.get("/students", getStudentsForModerator);
router.put("/students/:studentId/block", blockStudent);
router.put("/students/:studentId/unblock", unblockStudent);
router.delete("/students/:studentId", deleteStudent);

// Profile lock management routes
router.put("/students/:studentId/unlock-personal", unlockStudentPersonalInfo);
router.put("/students/:studentId/unlock-academic", unlockStudentAcademicInfo);
router.put("/students/:studentId/lock-personal", lockStudentPersonalInfo);
router.put("/students/:studentId/lock-academic", lockStudentAcademicInfo);

export default router;
