import type { Request, Response } from "express";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";
import { getDatabase } from "../db/index.js";
import { toPostSummary, toSeries } from "../serializers/index.js";

interface FacetRow {
  _id: string;
  count: number;
}

/**
 * GET /api/v1/tags — tags with published-post counts, derived from posts via
 * $unwind/$group so counts can never drift from reality.
 */
export const getTags = catchAsync(async (_req: Request, res: Response) => {
  const db = getDatabase();
  const rows = await db.posts.aggregate<FacetRow>([
    { $match: { status: "published" } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);

  const data = rows.map((row) => ({
    _id: row._id,
    name: row._id,
    slug: row._id.toLowerCase().replace(/\s+/g, "-"),
    postCount: row.count,
  }));

  res.status(200).json({ status: "success", data });
});

/** GET /api/v1/categories — same idea, one category per post. */
export const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const db = getDatabase();
  const rows = await db.posts.aggregate<FacetRow>([
    { $match: { status: "published" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);

  const data = rows.map((row) => ({
    _id: row._id,
    name: row._id,
    slug: row._id.toLowerCase().replace(/\s+/g, "-"),
    postCount: row.count,
  }));

  res.status(200).json({ status: "success", data });
});

/** GET /api/v1/series */
export const getAllSeries = catchAsync(async (_req: Request, res: Response) => {
  const db = getDatabase();
  const all = await db.series.find({}, { sort: { title: 1 } });

  const data = await Promise.all(
    all.map(async (series) => ({
      ...toSeries(series),
      postCount: await db.posts.count({
        seriesId: String(series._id),
        status: "published",
      }),
    }))
  );

  res.status(200).json({ status: "success", data });
});

/** GET /api/v1/series/:slug — series plus its posts in reading order. */
export const getSeriesBySlug = catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const series = await db.series.findOne({ slug: req.params.slug });
  if (!series) throw new AppError("Series not found.", 404);

  const posts = await db.posts.find(
    { seriesId: String(series._id), status: "published" },
    { sort: { seriesOrder: 1, publishedAt: 1 } }
  );

  res.status(200).json({
    status: "success",
    data: { ...toSeries(series), posts: posts.map(toPostSummary) },
  });
});

/** GET /api/v1/author — public "About Me" profile. */
export const getAuthorProfile = catchAsync(async (_req: Request, res: Response) => {
  const db = getDatabase();
  const [admin] = await db.users.find({}, { limit: 1 });
  if (!admin) throw new AppError("Author profile not found.", 404);

  res.status(200).json({
    status: "success",
    data: {
      name: admin.name,
      bio: admin.bio ?? "",
      avatarUrl: admin.avatarUrl ?? "",
    },
  });
});
