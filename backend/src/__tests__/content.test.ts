import { describe, expect, it } from "vitest";
import {
  calculateReadTime,
  escapeRegex,
  makeExcerpt,
  stripMarkdown,
  toSlug,
} from "../utils/content.js";

describe("toSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(toSlug("Big-O Notation Explained")).toBe("big-o-notation-explained");
  });

  it("strips punctuation and symbols", () => {
    expect(toSlug("Processes vs. Threads: What Differs?")).toBe(
      "processes-vs-threads-what-differs"
    );
  });

  it("collapses repeated whitespace", () => {
    expect(toSlug("  Virtual   Memory  ")).toBe("virtual-memory");
  });
});

describe("stripMarkdown", () => {
  it("removes fenced code blocks entirely", () => {
    const input = "Intro text\n\n```python\nprint('hello')\n```\n\nOutro text";
    const output = stripMarkdown(input);
    expect(output).not.toContain("print");
    expect(output).toContain("Intro text");
    expect(output).toContain("Outro text");
  });

  it("removes inline and display math", () => {
    expect(stripMarkdown("Complexity is $O(n^2)$ here")).toBe("Complexity is here");
    expect(stripMarkdown("$$\\sum_{i=1}^{n} i$$")).toBe("");
  });

  it("keeps link text but drops the URL", () => {
    expect(stripMarkdown("See [the docs](https://example.com) now")).toBe(
      "See the docs now"
    );
  });

  it("strips heading markers", () => {
    expect(stripMarkdown("## A Heading")).toBe("A Heading");
  });
});

describe("calculateReadTime", () => {
  it("returns at least one minute for short posts", () => {
    expect(calculateReadTime("Hello world")).toBe(1);
  });

  it("scales with prose length", () => {
    const long = "word ".repeat(2000);
    expect(calculateReadTime(long)).toBeGreaterThan(5);
  });

  it("does not count code as prose word-for-word", () => {
    const prose = "word ".repeat(400);
    const withCode = `${prose}\n\n\`\`\`js\n${"const x = 1;\n".repeat(50)}\`\`\``;
    // Code adds some time, but far less than 650 words of prose would.
    expect(calculateReadTime(withCode)).toBeLessThan(calculateReadTime(prose) + 4);
  });
});

describe("makeExcerpt", () => {
  it("returns short prose unchanged", () => {
    expect(makeExcerpt("A short sentence.")).toBe("A short sentence.");
  });

  it("truncates on a word boundary and adds an ellipsis", () => {
    const excerpt = makeExcerpt("word ".repeat(100), 50);
    expect(excerpt.length).toBeLessThanOrEqual(51);
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt).not.toMatch(/wo…$/);
  });

  it("ignores markdown syntax", () => {
    expect(makeExcerpt("# Title\n\nSome **bold** text")).toBe("Title Some bold text");
  });
});

describe("escapeRegex", () => {
  it("escapes regex metacharacters so user input is literal", () => {
    expect(escapeRegex("O(n^2)")).toBe("O\\(n\\^2\\)");
    // A malicious query must not become a wildcard.
    expect(new RegExp(escapeRegex(".*")).test("anything")).toBe(false);
    expect(new RegExp(escapeRegex(".*")).test("literal .* here")).toBe(true);
  });
});
