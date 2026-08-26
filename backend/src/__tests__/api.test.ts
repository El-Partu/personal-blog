import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../app.js";
import { setDatabase } from "../db/index.js";
import { createMemoryDatabase } from "../db/memory.js";
import type { Database } from "../db/types.js";

/**
 * Integration tests against the real Express app, backed by the in-memory
 * store (no mongod binary required). These cover the security-critical paths:
 * draft visibility, auth enforcement, and input sanitisation.
 */

let db: Database;
let token: string;
let seriesId: string;

beforeAll(async () => {
  db = createMemoryDatabase();
  setDatabase(db);

  await db.users.create({
    email: "test@example.com",
    passwordHash: await bcrypt.hash("SuperSecret123", 12),
    name: "Test Author",
    bio: "Test bio",
  });

  const series = await db.series.create({
    title: "Test Series",
    slug: "test-series",
    description: "A series for tests",
  });
  seriesId = String(series._id);

  await db.posts.create({
    title: "Published One",
    slug: "published-one",
    excerpt: "First published post",
    content: "# Hello\n\nSome content about algorithms.",
    status: "published",
    publishedAt: new Date("2026-01-01"),
    tags: ["Algorithms", "Testing"],
    category: "Algorithms",
    readTimeMinutes: 2,
    viewCount: 10,
    seriesId,
    seriesOrder: 1,
  });

  await db.posts.create({
    title: "Published Two",
    slug: "published-two",
    excerpt: "Second published post",
    content: "Content about databases and indexes.",
    status: "published",
    publishedAt: new Date("2026-02-01"),
    tags: ["Databases"],
    category: "Databases",
    readTimeMinutes: 3,
    viewCount: 5,
    seriesId,
    seriesOrder: 2,
  });

  await db.posts.create({
    title: "Secret Draft",
    slug: "secret-draft",
    excerpt: "Should never be public",
    content: "Unpublished content.",
    status: "draft",
    tags: ["Secret"],
    category: "Drafts",
    readTimeMinutes: 1,
    viewCount: 0,
  });

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "test@example.com", password: "SuperSecret123" });
  token = login.body.data.token;
});

afterAll(() => {
  setDatabase(null);
});

describe("GET /health", () => {
  it("reports the active driver", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.data.driver).toBe("memory");
  });
});

describe("public posts", () => {
  it("lists only published posts", async () => {
    const response = await request(app).get("/api/v1/posts");
    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(2);
    const slugs = response.body.data.items.map((p: { slug: string }) => p.slug);
    expect(slugs).not.toContain("secret-draft");
  });

  it("omits the body from listings", async () => {
    const response = await request(app).get("/api/v1/posts");
    expect(response.body.data.items[0]).not.toHaveProperty("content");
  });

  it("paginates", async () => {
    const response = await request(app).get("/api/v1/posts?limit=1&page=2");
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.page).toBe(2);
    expect(response.body.data.totalPages).toBe(2);
    expect(response.body.data.hasPrevious).toBe(true);
    expect(response.body.data.hasNext).toBe(false);
  });

  it("filters by tag", async () => {
    const response = await request(app).get("/api/v1/posts?tag=Databases");
    expect(response.body.data.total).toBe(1);
    expect(response.body.data.items[0].slug).toBe("published-two");
  });

  it("searches across title and content", async () => {
    const byTitle = await request(app).get("/api/v1/posts?q=Published One");
    expect(byTitle.body.data.total).toBe(1);

    const byContent = await request(app).get("/api/v1/posts?q=indexes");
    expect(byContent.body.data.total).toBe(1);
    expect(byContent.body.data.items[0].slug).toBe("published-two");
  });

  it("never surfaces drafts via search", async () => {
    const response = await request(app).get("/api/v1/posts?q=Secret");
    expect(response.body.data.total).toBe(0);
  });

  it("returns a single post with series navigation", async () => {
    const response = await request(app).get("/api/v1/posts/published-one");
    expect(response.status).toBe(200);
    expect(response.body.data.content).toContain("Hello");
    expect(response.body.data.series.slug).toBe("test-series");
    expect(response.body.data.seriesNavigation.position).toBe(1);
    expect(response.body.data.seriesNavigation.total).toBe(2);
    expect(response.body.data.seriesNavigation.next.slug).toBe("published-two");
  });

  it("404s for a draft slug", async () => {
    const response = await request(app).get("/api/v1/posts/secret-draft");
    expect(response.status).toBe(404);
  });

  it("increments the view counter", async () => {
    const before = await request(app).get("/api/v1/posts/published-one");
    const initial = before.body.data.viewCount;
    await request(app).post("/api/v1/posts/published-one/view").expect(204);
    const after = await request(app).get("/api/v1/posts/published-one");
    expect(after.body.data.viewCount).toBe(initial + 1);
  });
});

describe("taxonomy", () => {
  it("aggregates tag counts from published posts only", async () => {
    const response = await request(app).get("/api/v1/tags");
    const names = response.body.data.map((t: { name: string }) => t.name);
    expect(names).toContain("Algorithms");
    expect(names).not.toContain("Secret");
  });

  it("returns a series with its posts in order", async () => {
    const response = await request(app).get("/api/v1/series/test-series");
    expect(response.status).toBe(200);
    expect(response.body.data.posts.map((p: { slug: string }) => p.slug)).toEqual([
      "published-one",
      "published-two",
    ]);
  });
});

describe("auth", () => {
  it("rejects a wrong password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "WrongPassword1" });
    expect(response.status).toBe(401);
  });

  it("gives an identical error for an unknown account", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: "WrongPassword1" });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password.");
  });

  it("validates the payload", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "not-an-email", password: "x" });
    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("email");
  });

  it("never returns the password hash", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });
});

describe("admin routes", () => {
  it("rejects unauthenticated requests", async () => {
    await request(app).get("/api/v1/admin/posts").expect(401);
    await request(app).post("/api/v1/admin/posts").send({ title: "x" }).expect(401);
  });

  it("rejects a malformed token", async () => {
    await request(app)
      .get("/api/v1/admin/posts")
      .set("Authorization", "Bearer not.a.jwt")
      .expect(401);
  });

  it("includes drafts for an authenticated admin", async () => {
    const response = await request(app)
      .get("/api/v1/admin/posts")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    const slugs = response.body.data.items.map((p: { slug: string }) => p.slug);
    expect(slugs).toContain("secret-draft");
  });

  it("creates a post, deriving slug, excerpt and read time", async () => {
    const response = await request(app)
      .post("/api/v1/admin/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "A Brand New Post!",
        content: "# Heading\n\nThis is the body of a brand new post about compilers.",
        status: "published",
        tags: ["Compilers"],
        category: "Languages",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.slug).toBe("a-brand-new-post");
    expect(response.body.data.excerpt).toContain("Heading");
    expect(response.body.data.readTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(response.body.data.publishedAt).toBeTruthy();
  });

  it("de-duplicates slugs", async () => {
    const response = await request(app)
      .post("/api/v1/admin/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Published One", content: "Duplicate title content." });

    expect(response.status).toBe(201);
    expect(response.body.data.slug).toBe("published-one-2");
  });

  it("strips dangerous HTML from submitted markdown", async () => {
    const response = await request(app)
      .post("/api/v1/admin/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "XSS Attempt",
        content: 'Hi <script>alert(1)</script> and <img src=x onerror="alert(2)"> there',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.content).not.toContain("<script");
    expect(response.body.data.content).not.toContain("onerror");
  });

  it("preserves code fences through sanitisation", async () => {
    const response = await request(app)
      .post("/api/v1/admin/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Code Post",
        content: "```python\nif a < b and c > d:\n    print('ok')\n```",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.content).toContain("```python");
    expect(response.body.data.content).toContain("print('ok')");
  });

  it("rejects invalid input", async () => {
    const response = await request(app)
      .post("/api/v1/admin/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "", content: "" });
    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
  });

  it("updates and deletes a post", async () => {
    const created = await request(app)
      .post("/api/v1/admin/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Temporary Post", content: "To be removed." });

    const id = created.body.data._id;

    const updated = await request(app)
      .patch(`/api/v1/admin/posts/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Renamed Post", status: "published" });

    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("Renamed Post");
    expect(updated.body.data.status).toBe("published");

    await request(app)
      .delete(`/api/v1/admin/posts/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get(`/api/v1/admin/posts/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });

  it("detaches posts when their series is deleted", async () => {
    const series = await request(app)
      .post("/api/v1/admin/series")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Doomed Series", description: "Will be deleted" });

    const doomedId = series.body.data._id;

    const post = await request(app)
      .post("/api/v1/admin/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Series Member", content: "Body", seriesId: doomedId, seriesOrder: 1 });

    await request(app)
      .delete(`/api/v1/admin/series/${doomedId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const after = await request(app)
      .get(`/api/v1/admin/posts/${post.body.data._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(after.status).toBe(200);
    expect(after.body.data.seriesId).toBeUndefined();
  });
});

describe("unknown routes", () => {
  it("returns a 404 envelope", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
  });
});
