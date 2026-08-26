import { resolve } from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import publicRoutes from "./routes/publicRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import globalErrorHandler from "./middleware/globalErrorHandler.js";
import AppError from "./utils/appError.js";
import { getDatabase } from "./db/index.js";

const app = express();

// Behind Render/Railway/Vercel proxies, trust X-Forwarded-* so rate limiting
// and secure cookies see the real client protocol and IP.
app.set("trust proxy", 1);

app.use(
  helmet({
    // Images are served cross-origin to the Next.js app.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/**
 * CORS: the frontend runs on a different origin, so allowed origins come from
 * the CORS_ORIGINS env var. Credentials are enabled for the auth cookie.
 *
 * Matching is exact-match only — no wildcard subdomain patterns and no `*`.
 * Anyone can register a `*.vercel.app` or `*.e2b.app` subdomain, so accepting
 * those prefixes would let an attacker's page make authenticated API calls and
 * read the responses. `CORS_ORIGINS="*"` is refused at boot in production
 * (see config/env.ts).
 *
 * In local dev on an e2b sandbox, `corsPreviewOrigins` adds the *literal*
 * preview URLs of the current sandbox (derived from `E2B_SANDBOX_ID`) — still
 * exact origins, and never present in production.
 */
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin/server-side requests send no Origin header.
      if (!origin) return callback(null, true);
      // `*` is a dev-only convenience; production cannot reach this state.
      if (
        env.corsOrigins.includes("*") ||
        env.corsOrigins.includes(origin) ||
        env.corsPreviewOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(new AppError(`Origin ${origin} is not allowed by CORS.`, 403));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

if (!env.isProduction && env.nodeEnv !== "test") app.use(morgan("dev"));

// Global safety net against abuse of the public API.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// Locally stored images when Cloudinary is not configured.
app.use("/uploads", express.static(resolve(process.cwd(), "uploads"), { maxAge: "7d" }));

app.get("/health", (_req, res) => {
  let driver: string;
  try {
    driver = getDatabase().driver;
  } catch {
    driver = "disconnected";
  }
  res.status(200).json({ status: "success", data: { uptime: process.uptime(), driver } });
});

app.use("/api/v1", publicRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

app.use(globalErrorHandler);

export default app;
