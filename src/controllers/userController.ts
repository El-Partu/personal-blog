import type { Request, Response, NextFunction } from "express";
import catchAsync from "../middleware/catchAsync.js";

export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: "success",
    });
  }
);
