import express from "express";
import {
  getGuidance,
  getGuidanceForRole,
  createGuidance,
  updateGuidance,
  deleteGuidance,
} from "../controllers/guidanceController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createGuidanceRules,
  updateGuidanceRules,
  idParamRule,
  roleIdParamRule,
  listQueryRules,
} from "../validators/guidanceValidator.js";

const router = express.Router();

router.get("/", listQueryRules, validate, getGuidance);
router.get("/for-role/:roleId", roleIdParamRule, validate, getGuidanceForRole);

router.post("/", protect, authorize("admin", "guide"), createGuidanceRules, validate, createGuidance);
router.put("/:id", protect, authorize("admin", "guide"), updateGuidanceRules, validate, updateGuidance);
router.delete("/:id", protect, authorize("admin", "guide"), idParamRule, validate, deleteGuidance);

export default router;
