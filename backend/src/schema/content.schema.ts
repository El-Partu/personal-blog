import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const postInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .regex(slugPattern, "Slug may contain lowercase letters, numbers and hyphens only")
    .max(200)
    .optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string().min(1).max(60)).max(20).optional(),
  category: z.string().min(1).max(60).optional(),
  seriesId: z.string().nullable().optional(),
  seriesOrder: z.number().int().min(1).nullable().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
});

export type PostInputBody = z.infer<typeof postInputSchema>;

export const postUpdateSchema = postInputSchema.partial();
export type PostUpdateBody = z.infer<typeof postUpdateSchema>;

export const seriesInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().regex(slugPattern).max(200).optional(),
  description: z.string().max(1000).optional(),
});

export type SeriesInputBody = z.infer<typeof seriesInputSchema>;

export const tagInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  slug: z.string().regex(slugPattern).max(60).optional(),
});

export type TagInputBody = z.infer<typeof tagInputSchema>;

/** Query string values arrive as strings, so coerce numbers explicitly. */
export const postListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(9),
  tag: z.string().optional(),
  category: z.string().optional(),
  series: z.string().optional(),
  q: z.string().max(200).optional(),
  status: z.enum(["draft", "published"]).optional(),
  sort: z.enum(["newest", "oldest", "popular"]).default("newest"),
});

export type PostListQueryInput = z.infer<typeof postListQuerySchema>;
