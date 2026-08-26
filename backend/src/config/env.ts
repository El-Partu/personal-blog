import dotenv from "dotenv";

dotenv.config();

function optional(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

const nodeEnv = optional("NODE_ENV") ?? "development";
const isProduction = nodeEnv === "production";

const jwtSecret = optional("JWT_SECRET");
if (!jwtSecret && isProduction) {
  throw new Error("JWT_SECRET must be set in production.");
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(optional("PORT") ?? 4000),
  mongodbUri: optional("MONGODB_URI"),
  // A random-ish dev default keeps local runs frictionless; production throws above.
  jwtSecret: jwtSecret ?? "dev-only-insecure-secret-change-me",
  jwtExpiresIn: optional("JWT_EXPIRES_IN") ?? "30d",
  corsOrigins: (optional("CORS_ORIGINS") ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  admin: {
    email: optional("ADMIN_EMAIL") ?? "admin@example.com",
    password: optional("ADMIN_PASSWORD") ?? "ChangeMe123!",
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
