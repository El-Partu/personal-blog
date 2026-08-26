import type { Request, Response } from "express";
import sanitizeHtml from "sanitize-html";
import catchAsync from "../middleware/catchAsync.js";
import AppError from "../utils/appError.js";
import { getDatabase } from "../db/index.js";
import { toPost, toPostSummary, toSeries, toTag } from "../serializers/index.js";
import { ensureUniqueSlug, listPosts } from "../services/postService.js";
import { calculateReadTime, makeExcerpt, toSlug } from "../utils/content.js";
import { postListQuerySchema } from "../schema/content.schema.js";
import type {
  PostInputBody,
  PostUpdateBody,
  SeriesInputBody,
  TagInputBody,
} from "../schema/content.schema.js";
import type { IPost } from "../types/model.db.js";

/**
 * Strip dangerous HTML from markdown before storing (Section 5, "sanitize any
 * user input"). Markdown itself is preserved — only raw <script>/<iframe>-style
 * payloads and event handlers are removed, so code fences stay intact.
 */
function sanitizeMarkdown(markdown: string): string {
  return sanitizeHtml(markdown, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "figure",
      "figcaption",
      "details",
      "summary",
      "kbd",
      "sup",
      "sub",
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "loading"],
      a: ["href", "name", "target", "rel", "title"],
      "*": ["id", "class"],
    },
    // Keep markdown punctuation literal rather than HTML-escaping it.
    disallowedTagsMode: "discard",
    parser: { lowerCaseTags: true },
    textFilter: (text) => text,
  });
}

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

/** GET /api/v1/admin/posts — drafts included. */
export const listAdminPosts = catchAsync(async (req: Request, res: Response) => {
  const query = postListQuerySchema.parse(req.query);
  const result = await listPosts({ ...query, limit: Math.max(query.limit, 20) }, true);
  res.status(200).json({ status: "success", data: result });
});

/** GET /api/v1/admin/posts/:id */
export const getAdminPost = catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const post = await db.posts.findById(String(req.params.id));
  if (!post) throw new AppError("Post not found.", 404);
  res.status(200).json({ status: "success", data: toPost(post) });
});

/** POST /api/v1/admin/posts */
export const createPost = catchAsync(
  async (req: Request<unknown, unknown, PostInputBody>, res: Response) => {
    const db = getDatabase();
    const body = req.body;

    const content = sanitizeMarkdown(body.content);
    const slug = await ensureUniqueSlug(body.slug ?? body.title);
    const status = body.status ?? "draft";

    const doc: Partial<IPost> = {
      title: body.title,
      slug,
      content,
      excerpt: body.excerpt?.trim() ? body.excerpt.trim() : makeExcerpt(content),
      status,
      tags: body.tags ?? [],
      category: body.category ?? "Uncategorized",
      readTimeMinutes: calculateReadTime(content),
      viewCount: 0,
      seriesId: body.seriesId ?? null,
      seriesOrder: body.seriesOrder ?? null,
    };

    if (body.coverImage) doc.coverImage = body.coverImage;
    if (body.seoTitle) doc.seoTitle = body.seoTitle;
    if (body.seoDescription) doc.seoDescription = body.seoDescription;
    if (status === "published") {
      doc.publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
    }

    const created = await db.posts.create(doc);
    await syncTags(created.tags ?? []);

    res.status(201).json({ status: "success", data: toPost(created) });
  }
);

/** PATCH /api/v1/admin/posts/:id */
export const updatePost = catchAsync(
  async (req: Request<{ id: string }, unknown, PostUpdateBody>, res: Response) => {
    const db = getDatabase();
    const id = String(req.params.id);
    const existing = await db.posts.findById(id);
    if (!existing) throw new AppError("Post not found.", 404);

    const body = req.body;
    const patch: Partial<IPost> = {};

    if (body.title !== undefined) patch.title = body.title;
    if (body.slug !== undefined) patch.slug = await ensureUniqueSlug(body.slug, id);
    if (body.content !== undefined) {
      patch.content = sanitizeMarkdown(body.content);
      patch.readTimeMinutes = calculateReadTime(patch.content);
    }
    if (body.excerpt !== undefined) {
      patch.excerpt = body.excerpt.trim() || makeExcerpt(patch.content ?? existing.content);
    }
    if (body.coverImage !== undefined) patch.coverImage = body.coverImage;
    if (body.tags !== undefined) patch.tags = body.tags;
    if (body.category !== undefined) patch.category = body.category;
    if (body.seriesId !== undefined) patch.seriesId = body.seriesId;
    if (body.seriesOrder !== undefined) patch.seriesOrder = body.seriesOrder;
    if (body.seoTitle !== undefined) patch.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) patch.seoDescription = body.seoDescription;

    if (body.status !== undefined) {
      patch.status = body.status;
      // Stamp the publish date the first time a post goes live.
      if (body.status === "published" && !existing.publishedAt) {
        patch.publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
      }
    } else if (body.publishedAt !== undefined) {
      patch.publishedAt = new Date(body.publishedAt);
    }

    const updated = await db.posts.updateById(id, patch);
    if (!updated) throw new AppError("Post not found.", 404);
    if (patch.tags) await syncTags(patch.tags);

    res.status(200).json({ status: "success", data: toPost(updated) });
  }
);

/** DELETE /api/v1/admin/posts/:id */
export const deletePost = catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const deleted = await db.posts.deleteById(String(req.params.id));
  if (!deleted) throw new AppError("Post not found.", 404);
  res.status(204).end();
});

/* ------------------------------------------------------------------ */
/* Series                                                              */
/* ------------------------------------------------------------------ */

export const listAdminSeries = catchAsync(async (_req: Request, res: Response) => {
  const db = getDatabase();
  const all = await db.series.find({}, { sort: { title: 1 } });
  const data = await Promise.all(
    all.map(async (series) => ({
      ...toSeries(series),
      postCount: await db.posts.count({ seriesId: String(series._id) }),
    }))
  );
  res.status(200).json({ status: "success", data });
});

export const createSeries = catchAsync(
  async (req: Request<unknown, unknown, SeriesInputBody>, res: Response) => {
    const db = getDatabase();
    const slug = toSlug(req.body.slug ?? req.body.title);

    if (await db.series.findOne({ slug })) {
      throw new AppError("A series with that slug already exists.", 409);
    }

    const created = await db.series.create({
      title: req.body.title,
      slug,
      description: req.body.description ?? "",
    });
    res.status(201).json({ status: "success", data: toSeries(created) });
  }
);

export const updateSeries = catchAsync(
  async (req: Request<{ id: string }, unknown, Partial<SeriesInputBody>>, res: Response) => {
    const db = getDatabase();
    const patch: Record<string, unknown> = {};
    if (req.body.title !== undefined) patch.title = req.body.title;
    if (req.body.description !== undefined) patch.description = req.body.description;
    if (req.body.slug !== undefined) patch.slug = toSlug(req.body.slug);

    const updated = await db.series.updateById(String(req.params.id), patch);
    if (!updated) throw new AppError("Series not found.", 404);
    res.status(200).json({ status: "success", data: toSeries(updated) });
  }
);

/** Deleting a series detaches its posts rather than deleting them. */
export const deleteSeries = catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const id = String(req.params.id);

  const members = await db.posts.find({ seriesId: id });
  await Promise.all(
    members.map((post) =>
      db.posts.updateById(String(post._id), { seriesId: null, seriesOrder: null })
    )
  );

  const deleted = await db.series.deleteById(id);
  if (!deleted) throw new AppError("Series not found.", 404);
  res.status(204).end();
});

/** PATCH /api/v1/admin/series/:id/order — reorder posts within a series. */
export const reorderSeries = catchAsync(
  async (req: Request<{ id: string }, unknown, { postIds: string[] }>, res: Response) => {
    const db = getDatabase();
    const { postIds } = req.body;
    if (!Array.isArray(postIds)) throw new AppError("postIds must be an array.", 400);

    await Promise.all(
      postIds.map((postId, index) =>
        db.posts.updateById(postId, {
          seriesId: String(req.params.id),
          seriesOrder: index + 1,
        })
      )
    );

    const posts = await db.posts.find(
      { seriesId: String(req.params.id) },
      { sort: { seriesOrder: 1 } }
    );
    res.status(200).json({ status: "success", data: posts.map(toPostSummary) });
  }
);

/* ------------------------------------------------------------------ */
/* Tags                                                                */
/* ------------------------------------------------------------------ */

/** Keep the Tag collection in step with tags used on posts. */
async function syncTags(tags: string[]): Promise<void> {
  const db = getDatabase();
  await Promise.all(
    tags.map(async (name) => {
      const slug = toSlug(name);
      if (!slug) return;
      const existing = await db.tags.findOne({ slug });
      if (!existing) await db.tags.create({ name, slug });
    })
  );
}

export const listAdminTags = catchAsync(async (_req: Request, res: Response) => {
  const db = getDatabase();
  const all = await db.tags.find({}, { sort: { name: 1 } });
  const data = await Promise.all(
    all.map(async (tag) => toTag(tag, await db.posts.count({ tags: tag.name })))
  );
  res.status(200).json({ status: "success", data });
});

export const createTag = catchAsync(
  async (req: Request<unknown, unknown, TagInputBody>, res: Response) => {
    const db = getDatabase();
    const slug = toSlug(req.body.slug ?? req.body.name);
    if (await db.tags.findOne({ slug })) {
      throw new AppError("That tag already exists.", 409);
    }
    const created = await db.tags.create({ name: req.body.name, slug });
    res.status(201).json({ status: "success", data: toTag(created) });
  }
);

export const deleteTag = catchAsync(async (req: Request, res: Response) => {
  const db = getDatabase();
  const deleted = await db.tags.deleteById(String(req.params.id));
  if (!deleted) throw new AppError("Tag not found.", 404);
  res.status(204).end();
});
