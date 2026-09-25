import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// Role-agnostic: the verification email link carries only a token.
router.post("/verify-email", authController.verifyEmail);

export default router;
