import catchAsync from "../../middleware/catchAsync.js";
import AppError from "../../utils/appError.js";
import type { Request, Response, NextFunction } from "express";
import type { SignupInput } from "../../schema/auth.schema.js";
import User from "../../models/userModel.js";
import  EmailService  from "../../services/email.js";

export const signup = catchAsync(
  async (
    req: Request<{}, {}, SignupInput>,
    res: Response,
    next: NextFunction
  ) => {
    const { username, email, password, confirmPassword } = req.body;

    const user = await User.create({
      username,
      email,
      password,
      confirmPassword,
    });

     const verificationUrl = `${req.protocol}://${req.get("host")}/users/verify-email/${user._id}`;

     await new EmailService(user, verificationUrl).sendVerificationEmail();

    res.status(200).json({
      success: true, 
      data: {
        user
      },
    });
  }
);
