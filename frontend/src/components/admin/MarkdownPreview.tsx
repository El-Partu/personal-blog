"use client";

import { useEffect, useMemo, useState } from "react";
import katex from "katex";

/**
 * Lightweight client-side Markdown preview for the editor.
 *
 * This is intentionally a *preview*, not the production renderer: the published
 * page is rendered server-side by `lib/markdown.ts` with Shiki and the full
 * remark/rehype pipeline. Doing the same here would mean shipping Shiki's
 * grammars to the browser, so instead we render structure faithfully, run real
 * KaTeX for math, and show code blocks in a plain monospace frame.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMath(expression: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return `<code>${escapeHtml(expression)}</code>`;
  }
}

/** Inline-level markdown: code spans, math, links, bold, italic. */
function renderInline(text: string): string {
  const placeholders: string[] = [];
  const stash = (html: string): string => {
    placeholders.push(html);
    return `\u0000${placeholders.length - 1}\u0000`;
  };

  let output = text;

  // Inline code and math must be protected before other formatting runs.
  output = output.replace(/`([^`]+)`/g, (_match, code: string) =>
    stash(`<code>${escapeHtml(code)}</code>`)
  );
  output = output.replace(/\$([^$\n]+)\$/g, (_match, math: string) =>
    stash(renderMath(math, false))
  );

  output = escapeHtml(output);

  output = output
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  return output.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => placeholders[Number(index)] ?? "");
}

function renderMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];

  let index = 0;
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  while (index < lines.length) {
    const line = lines[index] ?? "";

    // Fenced code block
    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      closeList();
      const language = fence[1] ?? "";
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index] ?? "")) {
        body.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      html.push(
        `<div class="preview-code"><span class="preview-code-lang">${escapeHtml(language || "text")}</span><pre><code>${escapeHtml(body.join("\n"))}</code></pre></div>`
      );
      continue;
    }

    // Display math
    if (line.trim() === "$$") {
      closeList();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && (lines[index] ?? "").trim() !== "$$") {
        body.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      html.push(renderMath(body.join("\n"), true));
      continue;
    }

    // Table
    if (/^\s*\|/.test(line) && /^\s*\|[\s:|-]+\|?\s*$/.test(lines[index + 1] ?? "")) {
      closeList();
      const parseRow = (row: string) =>
        row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());

      const headers = parseRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && /^\s*\|/.test(lines[index] ?? "")) {
        rows.push(parseRow(lines[index] ?? ""));
        index += 1;
      }
      html.push(
        `<table><thead><tr>${headers.map((h) => `<th>${renderInline(h)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`
      );
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = (heading[1] ?? "#").length;
      html.push(`<h${level}>${renderInline(heading[2] ?? "")}</h${level}>`);
      index += 1;
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\s*\1\s*\1[\s\S]*$/.test(line) && line.trim().length >= 3) {
      closeList();
      html.push("<hr />");
      index += 1;
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      closeList();
      const body: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? "")) {
        body.push((lines[index] ?? "").replace(/^\s*>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote>${renderInline(body.join(" "))}</blockquote>`);
      continue;
    }

    // Lists
    const unordered = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (unordered || ordered) {
      const wanted: "ul" | "ol" = unordered ? "ul" : "ol";
      if (listType !== wanted) {
        closeList();
        html.push(`<${wanted}>`);
        listType = wanted;
      }
      html.push(`<li>${renderInline((unordered ?? ordered)?.[1] ?? "")}</li>`);
      index += 1;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      closeList();
      index += 1;
      continue;
    }

    // Paragraph (gather until blank/structural line)
    closeList();
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() !== "" &&
      !/^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|\s*>|\s*\|)/.test(lines[index] ?? "") &&
      (lines[index] ?? "").trim() !== "$$"
    ) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  closeList();
  return html.join("\n");
}

export default function MarkdownPreview({ source }: { source: string }) {
  const [debounced, setDebounced] = useState(source);

  // Keep typing smooth on very long posts.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(source), 180);
    return () => clearTimeout(timer);
  }, [source]);

  const html = useMemo(() => renderMarkdownToHtml(debounced), [debounced]);

  if (!debounced.trim()) {
    return (
      <p className="py-12 text-center text-sm" style={{ color: "var(--fg-subtle)" }}>
        Nothing to preview yet — start writing.
      </p>
    );
  }

  return <div className="prose-article preview-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
