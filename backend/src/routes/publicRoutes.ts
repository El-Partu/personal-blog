import { Router } from "express";
import * as postController from "../controllers/postController.js";
import * as taxonomy from "../controllers/taxonomyController.js";

const router = Router();

// Posts
router.get("/posts", postController.getPosts);
router.get("/posts/feed/all", postController.getAllPublishedForFeed);
router.get("/posts/:slug", postController.getPostBySlug);
router.get("/posts/:slug/related", postController.getRelatedPosts);
router.post("/posts/:slug/view", postController.incrementViewCount);

// Taxonomy
router.get("/tags", taxonomy.getTags);
router.get("/categories", taxonomy.getCategories);
router.get("/series", taxonomy.getAllSeries);
router.get("/series/:slug", taxonomy.getSeriesBySlug);

// Author profile for the About page
router.get("/author", taxonomy.getAuthorProfile);

export default router;
