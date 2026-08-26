import { describe, expect, it } from "vitest";
import {
  ID,
  absoluteUrl,
  blogPostingSchema,
  breadcrumbSchema,
  countWords,
  itemListSchema,
  organizationSchema,
  personSchema,
  webPageSchema,
  webSiteSchema,
} from "../seo";
import { site } from "../site";

const post = {
  title: "Big-O Notation, Explained Without the Hand-Waving",
  slug: "big-o-notation-explained",
  description: "A precise but readable introduction to Big-O.",
  content: "# Heading\n\nSome prose here.\n\n```js\nconst ignored = 'code should not count';\n```\n",
  category: "Algorithms",
  tags: ["Complexity", "Algorithms"],
  publishedAt: "2026-01-05T10:00:00.000Z",
  updatedAt: "2026-02-01T09:00:00.000Z",
  readTimeMinutes: 7,
  authorName: site.author.name,
};

describe("absoluteUrl", () => {
  it("prefixes site-relative paths", () => {
    expect(absoluteUrl("/blog")).toBe(`${site.url}/blog`);
    expect(absoluteUrl("blog")).toBe(`${site.url}/blog`);
  });

  it("leaves absolute URLs untouched", () => {
    expect(absoluteUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });
});

describe("countWords", () => {
  it("ignores fenced code blocks so wordCount reflects prose", () => {
    expect(countWords(post.content)).toBe(4); // "Heading Some prose here"... minus markdown
  });

  it("returns 0 for empty content", () => {
    expect(countWords("")).toBe(0);
  });
});

describe("entity graph", () => {
  it("uses one stable @id per site-wide entity", () => {
    expect(organizationSchema()["@id"]).toBe(ID.organization);
    expect(webSiteSchema()["@id"]).toBe(ID.website);
    expect(personSchema()["@id"]).toBe(ID.person);
  });

  it("links the article to the shared author and publisher by reference", () => {
    const schema = blogPostingSchema(post);
    expect(schema.author).toEqual({ "@id": ID.person });
    expect(schema.publisher).toEqual({ "@id": ID.organization });
    expect(schema.isPartOf).toEqual({ "@id": ID.website });
  });

  it("drops placeholder social URLs from sameAs", () => {
    // The LinkedIn placeholder must never be emitted as a real profile.
    const sameAs = organizationSchema().sameAs;
    expect(sameAs.some((url) => url.includes("your-handle"))).toBe(false);
  });

  it("exposes a working search endpoint in the SearchAction", () => {
    const target = webSiteSchema().potentialAction.target;
    expect(target.urlTemplate).toContain("/search?q={search_term_string}");
  });
});

describe("blogPostingSchema", () => {
  it("emits ISO-8601 dates", () => {
    const schema = blogPostingSchema(post);
    expect(schema.datePublished).toBe("2026-01-05T10:00:00.000Z");
    expect(schema.dateModified).toBe("2026-02-01T09:00:00.000Z");
  });

  it("truncates headlines beyond Google's 110-character limit", () => {
    const schema = blogPostingSchema({ ...post, title: "x".repeat(200) });
    expect(schema.headline.length).toBeLessThanOrEqual(110);
    // The untruncated title is preserved separately.
    expect(schema.name.length).toBe(200);
  });

  it("falls back to the post's own generated OG card when there is no cover", () => {
    const schema = blogPostingSchema(post);
    expect(schema.image.url).toBe(`${site.url}/blog/${post.slug}/opengraph-image`);
    expect(schema.image.width).toBe(1200);
    expect(schema.image.height).toBe(630);
  });

  it("prefers a real cover image when present", () => {
    const schema = blogPostingSchema({ ...post, coverImage: "https://cdn.example.com/c.png" });
    expect(schema.image.url).toBe("https://cdn.example.com/c.png");
  });

  it("encodes read time as an ISO-8601 duration", () => {
    expect(blogPostingSchema(post).timeRequired).toBe("PT7M");
  });

  it("falls back to updatedAt when the post has no publish date", () => {
    const schema = blogPostingSchema({ ...post, publishedAt: undefined });
    expect(schema.datePublished).toBe(post.updatedAt);
  });
});

describe("breadcrumbSchema", () => {
  it("numbers positions from 1 and resolves absolute URLs", () => {
    const crumbs = [
      { name: "Home", path: "/" },
      { name: "Articles", path: "/blog" },
    ];
    const schema = breadcrumbSchema(crumbs, `${site.url}/blog`);
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].item).toBe(`${site.url}/blog`);
  });
});

describe("itemListSchema", () => {
  it("counts and orders the listed posts", () => {
    const schema = itemListSchema(
      [
        { title: "A", slug: "a" },
        { title: "B", slug: "b" },
      ],
      `${site.url}/blog`,
      "All articles"
    );
    expect(schema.numberOfItems).toBe(2);
    expect(schema.itemListElement[1].url).toBe(`${site.url}/blog/b`);
  });
});

describe("webPageSchema", () => {
  it("only references a breadcrumb when there is a real trail", () => {
    const withTrail = webPageSchema({
      url: `${site.url}/blog`,
      name: "Articles",
      description: "d",
      crumbs: [
        { name: "Home", path: "/" },
        { name: "Articles", path: "/blog" },
      ],
    });
    expect(withTrail).toHaveProperty("breadcrumb");

    const noTrail = webPageSchema({ url: site.url, name: "Home", description: "d" });
    expect(noTrail).not.toHaveProperty("breadcrumb");
  });
});
