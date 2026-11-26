import express from "express";
import { protect } from "../middleware/auth.js";
import { getCareerDomains } from "../controllers/careerDomainController.js";

const router = express.Router();

router.get("/", protect, getCareerDomains);

export default router;
