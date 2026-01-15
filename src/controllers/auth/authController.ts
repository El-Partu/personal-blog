import catchAsync from "../../middleware/catchAsync.js";
import AppError from "../../utils/appError.js";
import type { Request, Response, NextFunction } from "express";
import type { loginInput, SignupInput } from "../../schema/auth.schema.js";
import User from "../../models/userModel.js";
import EmailService from "../../services/email.js";
import type { IUser } from "../../types/model.db.js";
import jwt from "jsonwebtoken";

const signToken = (user: IUser) => {
  return jwt.sign(
    { id: user.id, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET!,
    { expiresIn: "90d" }
  );
};

const sendTokenViaCokie = (res: Response, token: string) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 90 * 24 * 60 * 60 * 1000,
  };

  res.cookie("jwt", token, cookieOptions);
};

//Sign up route handler
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

    const token = signToken(user);
    sendTokenViaCokie(res, token);
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  }
);

export const login = catchAsync(
  async (
    req: Request<{}, {}, loginInput>,
    res: Response,
    next: NextFunction
  ) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new AppError("Invalid Email or Password", 400));
    }
    
    const user = await User.findOne({ email }).select("+password");

    if (!user || (user && !(await user.isPasswordCorrect(password)))) {
      return next(new AppError("Invalid Email or Password", 403));
    }
    
    const token = signToken(user);
    sendTokenViaCokie(res, token);
    
    res.status(200).json({
      status: 'success',
      token,
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
      return next(new AppError("Invalid request", 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(
        new AppError("This user does not exist. Please sign up", 403)
      );
    }
    user.isEmailVerified = true;
    user.updatedAt = new Date(Date.now());
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: "Email has been verified sucessfully!",
    });
  }
);
