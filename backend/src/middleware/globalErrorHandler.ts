import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import AppError from "../utils/appError.js";
import { env } from "../config/env.js";

interface MongoLikeError {
  code?: number;
  name?: string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message?: string }>;
  message?: string;
}

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of err.issues) {
      // Zod 4 reports unknown keys with an empty path; surface the key itself
      // so strict-schema rejections are actionable for API consumers.
      const key =
        issue.code === "unrecognized_keys"
          ? (issue.keys[0] ?? "_")
          : issue.path.join(".") || "_";
      errors[key] = issue.message;
    }
    res.status(400).json({ status: "fail", message: "Validation failed", errors });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  const candidate = err as MongoLikeError;

  // Duplicate key — most often a slug collision.
  if (candidate.code === 11000) {
    const field = Object.keys(candidate.keyValue ?? {})[0] ?? "field";
    res.status(409).json({
      status: "fail",
      message: `A record with that ${field} already exists.`,
    });
    return;
  }

  if (candidate.name === "ValidationError" && candidate.errors) {
    const errors: Record<string, string> = {};
    for (const [key, value] of Object.entries(candidate.errors)) {
      errors[key] = value?.message ?? "Invalid value";
    }
    res.status(400).json({ status: "fail", message: "Validation failed", errors });
    return;
  }

  if (candidate.name === "CastError") {
    res.status(400).json({ status: "fail", message: "Malformed identifier." });
    return;
  }

  if (candidate.name === "JsonWebTokenError" || candidate.name === "TokenExpiredError") {
    res.status(401).json({ status: "fail", message: "Invalid or expired token." });
    return;
  }

  console.error("[error]", err);
  res.status(500).json({
    status: "error",
    message: env.isProduction
      ? "Something went wrong."
      : (candidate.message ?? "Something went wrong."),
  });
};

export default globalErrorHandler;
