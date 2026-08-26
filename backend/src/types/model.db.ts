import type { PostStatus } from "@blog/shared";

/**
 * Document shapes as stored in MongoDB (dates are real `Date` objects here,
 * unlike the ISO strings used on the wire in `@blog/shared`).
 */

export interface IPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  status: PostStatus;
  publishedAt?: Date;
  tags: string[];
  category: string;
  seriesId?: string | null;
  seriesOrder?: number | null;
  readTimeMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISeries {
  _id: string;
  title: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITag {
  _id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The single admin account. `passwordHash` is never selected by default and
 * is never serialized to the client.
 */
export interface IAdminUser {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
