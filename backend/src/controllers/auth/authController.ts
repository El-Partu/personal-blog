import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import catchAsync from "../../middleware/catchAsync.js";
import AppError from "../../utils/appError.js";
import { env } from "../../config/env.js";
import { getDatabase } from "../../db/index.js";
import { toAdminUser } from "../../serializers/index.js";
import type { LoginInput, UpdateProfileInput } from "../../schema/auth.schema.js";
import type { IAdminUser } from "../../types/model.db.js";

function signToken(admin: IAdminUser): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ sub: String(admin._id), email: admin.email }, env.jwtSecret, options);
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: env.isProduction,
    // The admin UI is served from a different origin than the API in
    // production, so cross-site cookies must be SameSite=None.
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

/**
 * POST /api/v1/auth/login — single-admin JWT login.
 *
 * Returns an identical error for "no such user" and "wrong password" so the
 * endpoint cannot be used to enumerate accounts.
 */
export const login = catchAsync(async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
  const { email, password } = req.body;
  const db = getDatabase();

  const admin = await db.users.findOne({ email: email.toLowerCase() });
  const passwordMatches = admin
    ? await bcrypt.compare(password, admin.passwordHash ?? "")
    : // Burn a comparison anyway to keep response timing uniform.
      await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");

  if (!admin || !passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signToken(admin);
  setAuthCookie(res, token);

  res.status(200).json({
    status: "success",
    data: { token, user: toAdminUser(admin) },
  });
});

/** POST /api/v1/auth/logout */
export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie("jwt", { path: "/" });
  res.status(200).json({ status: "success", data: { message: "Logged out." } });
});

/** GET /api/v1/auth/me */
export const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.admin) throw new AppError("You are not logged in.", 401);
  res.status(200).json({ status: "success", data: toAdminUser(req.admin) });
});

/** PATCH /api/v1/auth/me — edit the public author profile. */
export const updateMe = catchAsync(
  async (req: Request<unknown, unknown, UpdateProfileInput>, res: Response) => {
    if (!req.admin) throw new AppError("You are not logged in.", 401);
    const db = getDatabase();

    const patch: Partial<IAdminUser> = {};
    if (req.body.name !== undefined) patch.name = req.body.name;
    if (req.body.bio !== undefined) patch.bio = req.body.bio;
    if (req.body.avatarUrl !== undefined) patch.avatarUrl = req.body.avatarUrl;

    const updated = await db.users.updateById(String(req.admin._id), patch);
    if (!updated) throw new AppError("Account not found.", 404);

    res.status(200).json({ status: "success", data: toAdminUser(updated) });
  }
);
