import catchAsync from "../../middleware/catchAsync.js";
import AppError from "../../utils/appError.js";
import type { Request, Response, NextFunction } from "express";

interface SignUpBody {
  email: string;
  password: string;
  confirmPassword: string;
}

const signup = catchAsync(
  async (
    req: Request<{}, {}, SignUpBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { email, password, confirmPassword } = req.body;
  }
);
