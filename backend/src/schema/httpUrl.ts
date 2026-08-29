import { z } from "zod";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Absolute http(s) URL only, with a sane length cap.
 *
 * `z.string().url()` also accepts `javascript:`, `data:` and other non-network
 * schemes. Those are stored-XSS vectors when a value ends up in an `src` /
 * `href` attribute (e.g. `coverImage`, `avatarUrl`), so every URL field must
 * go through this validator instead.
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return HTTP_PROTOCOLS.has(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Must be an absolute http(s) URL");
