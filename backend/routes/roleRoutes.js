import express from "express";
import { getRoles, getManagedRoles, getRoleById, createRole, updateRole, deleteRole } from "../controllers/roleController.js";

import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createRoleRules,
  updateRoleRules,
  idParamRule,
  listQueryRules,
  managedRoleQueryRules,
} from "../validators/roleValidator.js";

const router = express.Router();

router.get("/", protect, listQueryRules, validate, getRoles);
router.get("/manage", protect, authorize("admin", "institution"), managedRoleQueryRules, validate, getManagedRoles);
router.get("/:id", protect, idParamRule, validate, getRoleById);

// Admin + approved Guide (branch-scoped inside the controller)
router.post("/", protect, authorize("admin", "guide", "institution"), createRoleRules, validate, createRole);
router.put("/:id", protect, authorize("admin", "guide", "institution"), updateRoleRules, validate, updateRole);

// Admin or branch guide
router.delete("/:id", protect, authorize("admin", "guide", "institution"), idParamRule, validate, deleteRole);

export default router;
