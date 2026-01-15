import catchAsync from "../../middleware/catchAsync.js";
import AppError from "../../utils/appError.js";
import type { Request, Response, NextFunction } from "express";
import type { SignupInput } from "../../schema/auth.schema.js";
import User from "../../models/userModel.js";
import EmailService from "../../services/email.js";
import type { IUser } from "../../types/model.db.js";
import jwt from "jsonwebtoken"

const signToken = (user: IUser)=>{
  return jwt.sign({id: user.id, iat: Math.floor(Date.now() / 1000)}, process.env.JWT_SECRET!, {expiresIn: '90d'})
}
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

    const verificationUrl = `${req.protocol}://${req.get(
      "host"
    )}/users/verify-email/${user._id}`;

    await new EmailService(user, verificationUrl).sendVerificationEmail();

    const token = signToken(user)
    res.status(200).json({
      success: true,
      token,
      data: {
        user,
      },
    });
  }
);

interface Params {
  userId?: string;
}
export const verifyEmail = catchAsync(
  async (req: Request<Params>, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    console.log(userId);
    if (!userId) {
      return new AppError("Invalid request", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return new AppError("This user does not exist. Please sign up", 403);
    }
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email has been verified sucessfully!",
    });
  }
);
