import express from "express";
import rateLimit from "express-rate-limit";
import {
  loginAdmin,
  getMe,
  getDashboardStats,
  getRoleInterest,
  refreshToken,
  logoutAdmin,
  getAllStudents,
  getStudentById,
  deleteStudent,
  getStudentChats,
  getStudentChatDetail,
  getStudentRoadmaps,
  getAdminOverviewStats,
  getAllChats,
  getAllRoadmaps,
  getAllMessages,
  getDashboardRecent,
  getAllInstitutions,
  updateInstitutionStatus,
  getAdminAuditLogs,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { loginRules, interestQueryRules } from "../validators/adminValidator.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many requests." },
});

router.post("/login", authLimiter, loginRules, validate, loginAdmin);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logoutAdmin);

router.get("/me", protect, authorize("admin"), getMe);
router.get("/dashboard", protect, authorize("admin"), getDashboardStats);
router.get("/interest", protect, authorize("admin"), interestQueryRules, validate, getRoleInterest);

// ── Student management (admin-only) ────────────────────────────────────────
router.get("/overview-stats", protect, authorize("admin"), getAdminOverviewStats);
router.get("/recent", protect, authorize("admin"), getDashboardRecent);
router.get("/students", protect, authorize("admin"), getAllStudents);
router.delete("/students/:studentId", protect, authorize("admin"), deleteStudent);
router.get("/students/:studentId", protect, authorize("admin"), getStudentById);
router.get("/students/:studentId/chats", protect, authorize("admin"), getStudentChats);
router.get("/students/:studentId/chats/:chatId", protect, authorize("admin"), getStudentChatDetail);
router.get("/students/:studentId/roadmaps", protect, authorize("admin"), getStudentRoadmaps);

// ── Dedicated communication & AI activity (admin-only) ──────────────────────
router.get("/chats", protect, authorize("admin"), getAllChats);
router.get("/roadmaps", protect, authorize("admin"), getAllRoadmaps);
router.get("/messages", protect, authorize("admin"), getAllMessages);
router.get("/audit-logs", protect, authorize("admin"), getAdminAuditLogs);

// ── Institution management (admin-only) (Phase 1.4) ─────────────────────────
router.get("/institutions", protect, authorize("admin"), getAllInstitutions);
router.put("/institutions/:id/status", protect, authorize("admin"), updateInstitutionStatus);

export default router;
