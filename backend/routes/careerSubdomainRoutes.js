import express from "express";
import {
  createCareerSubdomain,
  deleteCareerSubdomain,
  getCareerSubdomains,
  updateCareerSubdomain,
} from "../controllers/careerSubdomainController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  careerSubdomainIdRule,
  createCareerSubdomainRules,
  listCareerSubdomainsRules,
  updateCareerSubdomainRules,
} from "../validators/careerSubdomainValidator.js";

const router = express.Router();

router.get("/", listCareerSubdomainsRules, validate, getCareerSubdomains);
router.post("/", protect, authorize("admin"), createCareerSubdomainRules, validate, createCareerSubdomain);
router.put("/:id", protect, authorize("admin"), updateCareerSubdomainRules, validate, updateCareerSubdomain);
router.delete("/:id", protect, authorize("admin"), careerSubdomainIdRule, validate, deleteCareerSubdomain);

export default router;
