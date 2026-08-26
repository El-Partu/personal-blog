import type { MetadataRoute } from "next";
import { getAllPostsForFeed, getAllSeries, getCategories, getTags } from "@/lib/api";
import { site } from "@/lib/site";
import { slugifyTag } from "@/lib/format";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, allSeries, tags, categories] = await Promise.all([
    getAllPostsForFeed().catch(() => []),
    getAllSeries().catch(() => []),
    getTags().catch(() => []),
    getCategories().catch(() => []),
  ]);

  /**
   * `lastModified` on the homepage/archive is driven by the newest post rather
   * than `new Date()`: a sitemap that claims every page changed on every crawl
   * trains Google to distrust the signal entirely.
   */
  const newest = posts.reduce<Date | undefined>((latest, post) => {
    const date = new Date(post.updatedAt);
    return !latest || date > latest ? date : latest;
  }, undefined);
  const lastModified = newest ?? new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/blog`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/series`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site.url}/tags`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const seriesRoutes: MetadataRoute.Sitemap = allSeries.map((series) => ({
    url: `${site.url}/series/${series.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${site.url}/tags/${slugifyTag(tag.name)}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${site.url}/category/${slugifyTag(category.name)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...seriesRoutes, ...categoryRoutes, ...tagRoutes];
}
