import mongoose, { Schema, type Model } from "mongoose";
import type { IPost } from "../types/model.db.js";
import { calculateReadTime, makeExcerpt } from "../utils/content.js";

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: "", maxlength: 500 },
    content: { type: String, required: true },
    coverImage: { type: String },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },
    tags: { type: [String], default: [], index: true },
    category: { type: String, default: "Uncategorized", index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", default: null },
    seriesOrder: { type: Number, default: null },
    readTimeMinutes: { type: Number, default: 1 },
    seoTitle: { type: String, maxlength: 200 },
    seoDescription: { type: String, maxlength: 400 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/**
 * MongoDB full-text index powering `GET /api/v1/posts?q=` (Section 3.1 search).
 * Weighted so a title match outranks a body match.
 */
postSchema.index(
  { title: "text", excerpt: "text", content: "text", tags: "text" },
  {
    weights: { title: 10, excerpt: 4, tags: 4, content: 1 },
    name: "post_text_index",
  }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ seriesId: 1, seriesOrder: 1 });

/** Derive read time and excerpt from the markdown body on every save. */
postSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    this.readTimeMinutes = calculateReadTime(this.content);
    if (!this.excerpt) this.excerpt = makeExcerpt(this.content);
  }
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const Post: Model<IPost> =
  (mongoose.models.Post as Model<IPost>) ??
  mongoose.model<IPost>("Post", postSchema);

export default Post;
