import express from "express";
import { getBranches, createBranch, deleteBranch } from "../controllers/branchController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createBranchRules, branchNameParamRule } from "../validators/branchValidator.js";

const router = express.Router();

router.get("/", getBranches);
router.post("/", protect, authorize("admin"), createBranchRules, validate, createBranch);
router.delete("/:name", protect, authorize("admin"), branchNameParamRule, validate, deleteBranch);

export default router;
