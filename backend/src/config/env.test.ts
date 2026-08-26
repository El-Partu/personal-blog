import { describe, expect, it } from "vitest";
import {
  assertProductionAdminPassword,
  assertProductionCorsOrigins,
  assertProductionJwtSecret,
  DEFAULT_ADMIN_PASSWORD,
  devPreviewOrigins,
  MIN_JWT_SECRET_LENGTH,
} from "./env.js";

describe("production boot guards", () => {
  it("refuses weak production credentials and wildcard CORS origins", () => {
    // JWT_SECRET: missing or too short in production; fine otherwise.
    expect(() => assertProductionJwtSecret(undefined, true)).toThrow(/JWT_SECRET/);
    expect(() => assertProductionJwtSecret("short", true)).toThrow(/at least 32/);
    expect(() =>
      assertProductionJwtSecret("x".repeat(MIN_JWT_SECRET_LENGTH), true)
    ).not.toThrow();
    expect(() => assertProductionJwtSecret("short", false)).not.toThrow();

    // ADMIN_PASSWORD: the dev default is refused in production.
    expect(() => assertProductionAdminPassword(DEFAULT_ADMIN_PASSWORD, true)).toThrow(
      /ADMIN_PASSWORD/
    );
    expect(() => assertProductionAdminPassword("A-real-password-2026", true)).not.toThrow();
    expect(() => assertProductionAdminPassword(DEFAULT_ADMIN_PASSWORD, false)).not.toThrow();

    // CORS_ORIGINS: "*" and wildcard patterns are refused in production.
    expect(() => assertProductionCorsOrigins(["*"], true)).toThrow(/exact origins/);
    expect(() => assertProductionCorsOrigins(["https://*.vercel.app"], true)).toThrow(
      /exact origins/
    );
    expect(() =>
      assertProductionCorsOrigins(["https://my-blog.vercel.app"], true)
    ).not.toThrow();
    expect(() => assertProductionCorsOrigins(["*"], false)).not.toThrow();
  });
});

describe("devPreviewOrigins", () => {
  it("yields exact origins for the current sandbox, never a wildcard", () => {
    const origins = devPreviewOrigins("sandbox-abc123", [3000, 4000]);
    expect(origins).toEqual([
      "https://3000-sandbox-abc123.e2b.app",
      "https://4000-sandbox-abc123.e2b.app",
    ]);
    // A sibling sandbox's preview URL must NOT be trusted.
    expect(origins).not.toContain("https://1234-someone-else.e2b.app");
    // Nothing wildcard-shaped and no unrelated host is ever produced.
    expect(origins.some((origin) => origin.includes("*"))).toBe(false);
    expect(
      origins.every((origin) => /^https:\/\/\d+-[a-z0-9-]+\.e2b\.app$/i.test(origin))
    ).toBe(true);
  });

  it("returns nothing when no sandbox id is available", () => {
    expect(devPreviewOrigins(undefined, [3000, 4000])).toEqual([]);
  });
});
