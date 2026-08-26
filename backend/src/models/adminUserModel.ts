import mongoose, { Schema, type Model } from "mongoose";
import validator from "validator";
import type { IAdminUser } from "../types/model.db.js";

/**
 * The single author account (Section 4, "Admin User").
 *
 * This blog is single-author by design, so there are no roles or permissions.
 * The account is created by `npm run seed` from ADMIN_EMAIL / ADMIN_PASSWORD.
 */
const adminUserSchema = new Schema<IAdminUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "Invalid email address",
      },
    },
    // Never returned by a plain query — must be explicitly `.select("+passwordHash")`.
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    bio: { type: String, maxlength: 1000 },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

const AdminUser: Model<IAdminUser> =
  (mongoose.models.AdminUser as Model<IAdminUser>) ??
  mongoose.model<IAdminUser>("AdminUser", adminUserSchema);

export default AdminUser;
