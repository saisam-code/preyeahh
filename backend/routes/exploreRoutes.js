import express from "express";
import {
  getExploreDomains,
  getExploreDomain,
  getExploreRoles,
  getExploreResources,
  getExploreOpportunities,
  getExploreGovernmentJobs,
} from "../controllers/exploreController.js";

const router = express.Router();

router.get("/domains", getExploreDomains);
router.get("/domains/:slug", getExploreDomain);
router.get("/roles", getExploreRoles);
router.get("/resources", getExploreResources);
router.get("/opportunities", getExploreOpportunities);
router.get("/government-jobs", getExploreGovernmentJobs);

export default router;
