import express from "express";
import { getCareerDomains } from "../controllers/careerDomainController.js";

const router = express.Router();

router.get("/", getCareerDomains);

export default router;
