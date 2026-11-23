import express from "express";
import {
  registerParent,
  loginParent,
  registerInstitution,
  loginInstitution,
  getExtendedMe,
  logoutExtended,
} from "../controllers/extendedAuthController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/parent/register", registerParent);
router.post("/parent/login", loginParent);
router.get("/parent/me", protect, authorize("parent"), getExtendedMe);
router.post("/parent/logout", logoutExtended);

router.post("/institution/register", registerInstitution);
router.post("/institution/login", loginInstitution);
router.get("/institution/me", protect, authorize("institution"), getExtendedMe);
router.post("/institution/logout", logoutExtended);

export default router;
