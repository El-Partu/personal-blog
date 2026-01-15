import { Router } from "express";
import * as userController from "../controllers/userController.js";
import * as authController from "../controllers/auth/authController.js";
import validate from "../middleware/validation.js";
import { signupSchema } from "../schema/auth.schema.js";
const router = Router();

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/signup", validate(signupSchema), authController.signup);

export default router;
