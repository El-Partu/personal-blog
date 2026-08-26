import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import { env } from "../config/env.js";
import { getDatabase } from "../db/index.js";
import type { IAdminUser } from "../types/model.db.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: IAdminUser;
    }
  }
}

export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Guard for every admin route (Section 5, "protect admin routes with auth").
 * Accepts `Authorization: Bearer <token>` or the httpOnly `jwt` cookie.
 */
export default async function protect(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    let token: string | undefined;

    if (header?.startsWith("Bearer ")) {
      token = header.slice(7).trim();
    } else if (typeof req.headers.cookie === "string") {
      const match = /(?:^|;\s*)jwt=([^;]+)/.exec(req.headers.cookie);
      if (match?.[1]) token = decodeURIComponent(match[1]);
    }

    if (!token) {
      return next(new AppError("You are not logged in.", 401));
    }

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const admin = await getDatabase().users.findById(payload.sub);

    if (!admin) {
      return next(new AppError("This account no longer exists.", 401));
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
}
