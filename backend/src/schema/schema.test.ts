import { describe, expect, it } from "vitest";
import { postInputSchema } from "./content.schema.js";
import { updateProfileSchema } from "./auth.schema.js";

describe("http(s) URL validation", () => {
  it("accepts only http(s) URLs for coverImage and avatarUrl", () => {
    const basePost = { title: "T", content: "C" };
    const dangerous = [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ];

    for (const url of dangerous) {
      expect(postInputSchema.safeParse({ ...basePost, coverImage: url }).success).toBe(false);
      expect(updateProfileSchema.safeParse({ avatarUrl: url }).success).toBe(false);
    }

    expect(
      postInputSchema.safeParse({ ...basePost, coverImage: "https://cdn.example.com/a.png" })
        .success
    ).toBe(true);
    expect(postInputSchema.safeParse({ ...basePost, coverImage: "" }).success).toBe(true);
    expect(
      updateProfileSchema.safeParse({ avatarUrl: "https://avatars.example.com/a.png" }).success
    ).toBe(true);
    expect(updateProfileSchema.safeParse({ avatarUrl: "" }).success).toBe(true);
  });
});
