import mongoose, { Schema, type HydratedDocument, Document, Model, type CallbackWithoutResult } from "mongoose";
import validator from "validator";
import { UserRole } from "../types/model.db.js";
import type { IUser } from "../types/model.db.js";
import bcrypt from "bcryptjs";

const userSchema: Schema<IUser> = new Schema<IUser>({
  username: {
    type: String,
    // unique: true,
    required: true,
    minlength: [8, "Please your name should be more than 8 characters."],
    maxlength: [255, "Please your name cannot exceed 255 characters"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (value: string) => validator.isEmail(value),
      message: "Invalid email address",
    },
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (this: any, value: string) {
        return (this as IUser).password === value;
      },
      message: "Please your password mismatch",
    },
  },
  active: { type: Boolean, default: true, select: false },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

userSchema.pre("save", async function (this: HydratedDocument<IUser>) {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined as unknown as string;
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
