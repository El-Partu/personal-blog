import dotenv from "dotenv";

dotenv.config();

function optional(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

const nodeEnv = optional("NODE_ENV") ?? "development";
const isProduction = nodeEnv === "production";

/** Minimum length for a production JWT signing secret. */
export const MIN_JWT_SECRET_LENGTH = 32;

/** The dev default admin password; must never be used in production. */
export const DEFAULT_ADMIN_PASSWORD = "ChangeMe123!";

/**
 * Production boot guards. Kept as pure functions (rather than inline checks)
 * so they are unit-testable without loading the whole env module.
 */

/** Refuse to boot in production without a long, real JWT secret. */
export function assertProductionJwtSecret(secret: string | undefined, production: boolean): void {
  if (!production) return;
  if (!secret) {
    throw new Error("JWT_SECRET must be set in production.");
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production. ` +
        "Generate one with: openssl rand -base64 48"
    );
  }
}

/** Refuse to boot in production with the default admin password. */
export function assertProductionAdminPassword(password: string | undefined, production: boolean): void {
  if (!production) return;
  if (!password || password === DEFAULT_ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_PASSWORD must be set to a non-default value in production (the dev default is not allowed)."
    );
  }
}

/** Refuse to boot in production with a wildcard CORS origin. `CORS_ORIGINS="*"` (or any pattern containing `*`) would let any site issue credentialed cross-origin API calls; every entry must name an exact origin. */
export function assertProductionCorsOrigins(origins: string[], production: boolean): void {
  if (!production) return;
  if (origins.includes("*") || origins.some((origin) => origin.includes("*"))) {
    throw new Error(
      'CORS_ORIGINS must list exact origins in production; "*" and wildcard patterns are not allowed.'
    );
  }
}

/**
 * Exact preview origins for the *current* e2b sandbox (dev only).
 *
 * The sandbox id is an opaque per-session value, so this yields two literal
 * origins (the frontend and API preview URLs) — never a `*.e2b.app` pattern.
 * Only the sandbox the server is actually running in is trusted, and only
 * outside production; production keeps exact-match-only CORS, so an attacker
 * registering an unrelated subdomain cannot obtain credentialed access.
 */
export function devPreviewOrigins(sandboxId: string | undefined, ports: number[]): string[] {
  if (!sandboxId) return [];
  const origins = new Set<string>();
  for (const port of ports) origins.add(`https://${port}-${sandboxId}.e2b.app`);
  return [...origins];
}

const jwtSecret = optional("JWT_SECRET");
const adminPassword = optional("ADMIN_PASSWORD") ?? DEFAULT_ADMIN_PASSWORD;
const corsOrigins = (optional("CORS_ORIGINS") ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Dev-only: the exact preview URLs of the e2b sandbox this process runs in.
const port = Number(optional("PORT") ?? 4000);
const corsPreviewOrigins = isProduction
  ? []
  : devPreviewOrigins(optional("E2B_SANDBOX_ID"), [3000, port]);

assertProductionJwtSecret(jwtSecret, isProduction);
assertProductionAdminPassword(adminPassword, isProduction);
assertProductionCorsOrigins(corsOrigins, isProduction);
assertProductionCorsOrigins(corsPreviewOrigins, isProduction);

export const env = {
  nodeEnv,
  isProduction,
  port,
  mongodbUri: optional("MONGODB_URI"),
  // A random-ish dev default keeps local runs frictionless; production throws above.
  jwtSecret: jwtSecret ?? "dev-only-insecure-secret-change-me",
  jwtExpiresIn: optional("JWT_EXPIRES_IN") ?? "30d",
  corsOrigins,
  corsPreviewOrigins,
  admin: {
    email: optional("ADMIN_EMAIL") ?? "admin@example.com",
    password: adminPassword,
    name: optional("ADMIN_NAME") ?? "Blog Author",
  },
  cloudinary: {
    cloudName: optional("CLOUDINARY_CLOUD_NAME"),
    apiKey: optional("CLOUDINARY_API_KEY"),
    apiSecret: optional("CLOUDINARY_API_SECRET"),
    get enabled(): boolean {
      return Boolean(
        optional("CLOUDINARY_CLOUD_NAME") &&
          optional("CLOUDINARY_API_KEY") &&
          optional("CLOUDINARY_API_SECRET")
      );
    },
  },
} as const;
