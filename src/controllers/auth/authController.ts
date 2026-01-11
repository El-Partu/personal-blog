import catchAsync from "../../middleware/catchAsync.js";
import AppError from "../../utils/appError.js";
import type { Request, Response, NextFunction } from "express";
import type { SignupInput } from "../../schema/auth.schema.js";

export const signup = catchAsync(
  async (
    req: Request<{}, {}, SignupInput>,
    res: Response,
    next: NextFunction
  ) => {
    const { email, password, confirmPassword } = req.body;
    res.status(200).json({
      status: "success",
      data: {
        email: "",
      },
    });
  }
);
