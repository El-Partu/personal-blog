import { Router } from "express";
import * as userController from "../controllers/userController.js";
import * as authController from "../controllers/auth/authController.js";
import validate from "../middleware/validation.js";
import { signupSchema, loginSchema } from "../schema/auth.schema.js";
const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/signup", validate(signupSchema), authController.signup);
router.get("/verify-email/:userId", authController.verifyEmail);

export default router;
