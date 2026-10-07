import express from "express";
import {
  createRoleRequest,
  listRoleRequests,
  dismissRoleRequest,
  clearRoleRequests,
  acceptRoleRequest,
  getStudentNotifications,
  markNotificationRead,
} from "../controllers/roleRequestController.js";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createRoleRequestRules, idParamRule } from "../validators/roleRequestValidator.js";

const router = express.Router();

router.post("/", optionalAuth, createRoleRequestRules, validate, createRoleRequest);

// Student notifications (must precede /:id)
router.get("/student-notifications", protect, authorize("student"), getStudentNotifications);
router.post("/student-notifications/:id/read", protect, authorize("student"), idParamRule, validate, markNotificationRead);

// Admin & Guide management
router.get("/", protect, authorize("admin", "guide"), listRoleRequests);
router.patch("/:id/dismiss", protect, authorize("admin", "guide"), idParamRule, validate, dismissRoleRequest);
router.patch("/:id/accept", protect, authorize("admin", "guide"), idParamRule, validate, acceptRoleRequest);
router.delete("/", protect, authorize("admin"), clearRoleRequests); // only admin can bulk-delete

export default router;
