import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { createHighlighter, type Highlighter } from "shiki";
import type { Element, Root } from "hast";
import type { TocEntry } from "@blog/shared";

/**
 * Markdown pipeline (all server-side, so no highlighting cost in the browser):
 *
 *   markdown -> remark (GFM + math) -> rehype -> slugs -> KaTeX -> Shiki -> HTML
 *
 * Shiki runs at render time and the result is cached by Next.js ISR, so pages
 * are served as static HTML with zero client-side syntax-highlighting JS.
 */

const LANGUAGES = [
  "python", "javascript", "typescript", "jsx", "tsx", "c", "cpp", "java",
  "go", "rust", "sql", "bash", "shell", "json", "yaml", "html", "css",
  "asm", "text", "diff", "markdown", "haskell", "ruby", "php", "kotlin",
  "swift", "scala", "r", "matlab", "lua", "toml", "xml", "dockerfile",
];

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  // Loading Shiki's grammars is expensive, so keep one instance per process.
  highlighterPromise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: LANGUAGES,
  });
  return highlighterPromise;
}

function normaliseLanguage(lang: string | undefined): string {
  if (!lang) return "text";
  const cleaned = lang.toLowerCase().trim();
  const aliases: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    "c++": "cpp",
    sh: "bash",
    zsh: "bash",
    console: "bash",
    plaintext: "text",
    txt: "text",
    "": "text",
  };
  const resolved = aliases[cleaned] ?? cleaned;
  return LANGUAGES.includes(resolved) ? resolved : "text";
}

/** Add a permalink anchor to every h2/h3/h4 that rehype-slug gave an id. */
function rehypeHeadingAnchors() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!["h2", "h3", "h4"].includes(node.tagName)) return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;

      node.children.push({
        type: "element",
        tagName: "a",
        properties: {
          href: `#${id}`,
          className: ["heading-anchor"],
          "aria-label": "Link to this section",
        },
        children: [{ type: "text", value: "#" }],
      });
    });
  };
}

/**
 * Replace each <pre><code> with Shiki-highlighted markup.
 * Returns a unified *attacher* (a function returning the transformer), which
 * is what `.use()` expects.
 */
function rehypeShiki(highlighter: Highlighter) {
  return () => (tree: Root) => {
    const jobs: (() => void)[] = [];

    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const [child] = node.children;
      if (!child || child.type !== "element" || child.tagName !== "code") return;

      const className = child.properties?.className;
      const languageClass = Array.isArray(className)
        ? className.find((c) => typeof c === "string" && c.startsWith("language-"))
        : undefined;
      const lang = normaliseLanguage(
        typeof languageClass === "string" ? languageClass.replace("language-", "") : undefined
      );

      const code = child.children
        .filter((c): c is { type: "text"; value: string } => c.type === "text")
        .map((c) => c.value)
        .join("");

      jobs.push(() => {
        const html = highlighter.codeToHtml(code, {
          lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        });

        // Shiki returns a full <pre> element; splice it in as raw HTML.
        (parent.children as unknown[])[index] = {
          type: "raw",
          value: `<div class="code-block" data-language="${lang}">${html}</div>`,
        };
      });
    });

    for (const job of jobs) job();
  };
}

export interface RenderedMarkdown {
  html: string;
  toc: TocEntry[];
}

/** Extract h2/h3 headings for the table of contents. */
function extractToc() {
  const toc: TocEntry[] = [];
  const plugin = () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!["h2", "h3"].includes(node.tagName)) return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;

      let text = "";
      visit(node, "text", (textNode: { value: string }) => {
        text += textNode.value;
      });

      toc.push({
        id,
        text: text.trim(),
        depth: Number(node.tagName.slice(1)),
      });
    });
  };
  return { plugin, toc };
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const highlighter = await getHighlighter();
  const { plugin: tocPlugin, toc } = extractToc();

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(tocPlugin)
    .use(rehypeHeadingAnchors)
    // rehype-katex never throws on invalid math — it renders the error inline.
    .use(rehypeKatex, { strict: false, output: "html" })
    .use(rehypeShiki(highlighter))
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return { html: String(file), toc };
}
