import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth/authController.js";
import { validateBody } from "../middleware/validation.js";
import protect from "../middleware/protect.js";
import { loginSchema, updateProfileSchema } from "../schema/auth.schema.js";

const router = Router();

/** Throttle credential stuffing (Section 5, "rate-limit forms"). */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { status: "fail", message: "Too many login attempts. Try again later." },
});

router.post("/login", loginLimiter, validateBody(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);
router.patch("/me", protect, validateBody(updateProfileSchema), authController.updateMe);

export default router;
