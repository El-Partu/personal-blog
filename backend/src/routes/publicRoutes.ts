import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as postController from "../controllers/postController.js";
import * as taxonomy from "../controllers/taxonomyController.js";

const router = Router();

/**
 * The view counter is a public, unauthenticated write — a tight per-IP limit
 * stops a single client from inflating view counts (or driving write cost).
 * The browser only fires one view per post per session, so 30 per 5 minutes is
 * far above honest usage.
 */
const viewLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { status: "fail", message: "Too many view requests. Try again later." },
});

// Posts
router.get("/posts", postController.getPosts);
router.get("/posts/feed/all", postController.getAllPublishedForFeed);
router.get("/posts/:slug", postController.getPostBySlug);
router.get("/posts/:slug/related", postController.getRelatedPosts);
router.post("/posts/:slug/view", viewLimiter, postController.incrementViewCount);

// Taxonomy
router.get("/tags", taxonomy.getTags);
router.get("/categories", taxonomy.getCategories);
router.get("/series", taxonomy.getAllSeries);
router.get("/series/:slug", taxonomy.getSeriesBySlug);

// Author profile for the About page
router.get("/author", taxonomy.getAuthorProfile);

export default router;
