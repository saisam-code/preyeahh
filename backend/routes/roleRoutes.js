import express from "express";
import { getRoles, getRoleById, createRole, updateRole, deleteRole } from "../controllers/roleController.js";

import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createRoleRules,
  updateRoleRules,
  idParamRule,
  listQueryRules,
} from "../validators/roleValidator.js";

const router = express.Router();

// Public — role browsing needs no login (matches roles.html being viewable pre-auth)
router.get("/", listQueryRules, validate, getRoles);
router.get("/:id", idParamRule, validate, getRoleById);

// Admin + approved Guide (branch-scoped inside the controller)
router.post("/", protect, authorize("admin", "guide"), createRoleRules, validate, createRole);
router.put("/:id", protect, authorize("admin", "guide"), updateRoleRules, validate, updateRole);

// Admin or branch guide
router.delete("/:id", protect, authorize("admin", "guide"), idParamRule, validate, deleteRole);

export default router;
