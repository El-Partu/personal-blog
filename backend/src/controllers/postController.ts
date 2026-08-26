import type { Request, Response } from "express";
import type { PostWithSeries } from "@blog/shared";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";
import { getDatabase } from "../db/index.js";
import { toPost, toSeries } from "../serializers/index.js";
import {
  findRelatedPosts,
  getSeriesNavigation,
  listPosts,
} from "../services/postService.js";
import { postListQuerySchema } from "../schema/content.schema.js";

/** GET /api/v1/posts — published posts only, with filtering + pagination. */
export const getPosts = catchAsync(async (req: Request, res: Response) => {
  const query = postListQuerySchema.parse(req.query);
  const result = await listPosts(query, false);
  res.status(200).json({ status: "success", data: result });
});

/** GET /api/v1/posts/:slug — full post plus series nav. */
export const getPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const slug = req.params.slug;

  const post = await db.posts.findOne({ slug, status: "published" });
  if (!post) throw new AppError("Post not found.", 404);

  const payload: PostWithSeries = toPost(post);

  if (post.seriesId) {
    const series = await db.series.findById(String(post.seriesId));
    if (series) payload.series = toSeries(series);
    const navigation = await getSeriesNavigation(post);
    if (navigation) payload.seriesNavigation = navigation;
  }

  res.status(200).json({ status: "success", data: payload });
});

/** GET /api/v1/posts/:slug/related */
export const getRelatedPosts = catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const post = await db.posts.findOne({ slug: req.params.slug, status: "published" });
  if (!post) throw new AppError("Post not found.", 404);

  const related = await findRelatedPosts(post, 3);
  res.status(200).json({ status: "success", data: related });
});

/**
 * POST /api/v1/posts/:slug/view — increment the read counter.
 * Fire-and-forget from the client; failures must never break a page render.
 */
export const incrementViewCount = catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const post = await db.posts.findOne({ slug: req.params.slug, status: "published" });
  if (post) await db.posts.increment(String(post._id), "viewCount", 1);
  res.status(204).end();
});

/** GET /api/v1/posts/feed/all — every published post, for RSS + sitemap. */
export const getAllPublishedForFeed = catchAsync(async (_req: Request, res: Response) => {
  const db = getDatabase();
  const posts = await db.posts.find(
    { status: "published" },
    { sort: { publishedAt: -1 } }
  );
  res.status(200).json({ status: "success", data: posts.map(toPost) });
});
