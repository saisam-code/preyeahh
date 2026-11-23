import express from "express";
import {
  registerParent,
  loginParent,
  registerInstitution,
  loginInstitution,
} from "../controllers/extendedAuthController.js";

const router = express.Router();

router.post("/parent/register", registerParent);
router.post("/parent/login", loginParent);
router.post("/institution/register", registerInstitution);
router.post("/institution/login", loginInstitution);

export default router;
