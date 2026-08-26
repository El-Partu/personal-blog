import readingTime from "reading-time";
import slugify from "slugify";

/**
 * Strip markdown syntax so read-time and excerpts measure prose, not punctuation.
 * Code fences are removed entirely — nobody reads a code block word by word.
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]*\$/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_~]{1,3}/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole minutes, minimum 1. Code-heavy posts still get credit via a small bonus. */
export function calculateReadTime(markdown: string): number {
  const prose = stripMarkdown(markdown);
  const stats = readingTime(prose);
  const codeLines = (markdown.match(/```[\s\S]*?```/g) ?? []).join("\n").split("\n").length;
  const codeMinutes = codeLines / 60;
  return Math.max(1, Math.round(stats.minutes + codeMinutes));
}

export function makeExcerpt(markdown: string, maxLength = 200): string {
  const prose = stripMarkdown(markdown);
  if (prose.length <= maxLength) return prose;
  const cut = prose.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}

export function toSlug(value: string): string {
  return slugify(value, { lower: true, strict: true, trim: true });
}

/** Escape a user-supplied string so it can be safely used inside a RegExp. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
