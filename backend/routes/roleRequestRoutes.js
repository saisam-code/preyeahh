import express from "express";
import {
  createRoleRequest,
  listRoleRequests,
  dismissRoleRequest,
  clearRoleRequests,
} from "../controllers/roleRequestController.js";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createRoleRequestRules, idParamRule } from "../validators/roleRequestValidator.js";

const router = express.Router();

router.post("/", optionalAuth, createRoleRequestRules, validate, createRoleRequest);

router.get("/", protect, authorize("admin"), listRoleRequests);
router.patch("/:id/dismiss", protect, authorize("admin"), idParamRule, validate, dismissRoleRequest);
router.delete("/", protect, authorize("admin"), clearRoleRequests);

export default router;
