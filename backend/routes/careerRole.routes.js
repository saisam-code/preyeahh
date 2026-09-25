import { Router } from "express";
import * as careerRoleController from "../controllers/careerRole.controller.js";
import { roleGate } from "../middleware/auth.middleware.js";

const router = Router();

// Public
router.get("/", careerRoleController.getRoles);
router.get("/:id", careerRoleController.getRoleById);

// Admin or guide (guide restricted to own branch inside controller)
router.post("/", roleGate(["admin", "guide"]), careerRoleController.createRole);
router.put("/:id", roleGate(["admin", "guide"]), careerRoleController.updateRole);

// Admin only
router.delete("/:id", roleGate("admin"), careerRoleController.deleteRole);

export default router;
