import express from "express";
import { getBranches, getManagedBranches, createBranch, updateBranchDomains, deleteBranch } from "../controllers/branchController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { createBranchRules, listBranchesRules, updateBranchDomainsRules, branchNameParamRule } from "../validators/branchValidator.js";

const router = express.Router();

router.get("/", listBranchesRules, validate, getBranches);
router.get("/manage", protect, authorize("admin"), getManagedBranches);
router.post("/", protect, authorize("admin"), createBranchRules, validate, createBranch);
router.put("/:name/domains", protect, authorize("admin"), updateBranchDomainsRules, validate, updateBranchDomains);
router.delete("/:name", protect, authorize("admin"), branchNameParamRule, validate, deleteBranch);

export default router;
