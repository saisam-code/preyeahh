import express from "express";
import {
  getBeyond,
  getBeyondById,
  createBeyond,
  updateBeyond,
  deleteBeyond,
} from "../controllers/beyondController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createBeyondRules,
  updateBeyondRules,
  idParamRule,
  listQueryRules,
} from "../validators/beyondValidator.js";

const router = express.Router();

router.get("/", listQueryRules, validate, getBeyond);
router.get("/:id", idParamRule, validate, getBeyondById);

router.post("/", protect, authorize("admin", "guide"), createBeyondRules, validate, createBeyond);
router.put("/:id", protect, authorize("admin", "guide"), updateBeyondRules, validate, updateBeyond);
router.delete("/:id", protect, authorize("admin", "guide"), idParamRule, validate, deleteBeyond);

export default router;
