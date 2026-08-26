"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Post, Series } from "@blog/shared";
import MarkdownPreview from "./MarkdownPreview";
import {
  AdminApiError,
  createPost,
  deletePost,
  listSeries,
  updatePost,
  uploadImage,
} from "@/lib/adminClient";

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  status: "draft" | "published";
  category: string;
  tags: string;
  seriesId: string;
  seriesOrder: string;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  status: "draft",
  category: "",
  tags: "",
  seriesId: "",
  seriesOrder: "",
  seoTitle: "",
  seoDescription: "",
};

function toFormState(post: Post): FormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImage: post.coverImage ?? "",
    status: post.status,
    category: post.category ?? "",
    tags: (post.tags ?? []).join(", "),
    seriesId: post.seriesId ?? "",
    seriesOrder: post.seriesOrder != null ? String(post.seriesOrder) : "",
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
  };
}

export default function PostEditor({ post }: { post?: Post }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(post ? toFormState(post) : EMPTY);
  const [series, setSeries] = useState<Series[]>([]);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listSeries()
      .then(setSeries)
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  /** Ctrl/Cmd+S saves without leaving the editor. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void save(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, saving]);

  /** Insert markdown at the caret, keeping focus in the textarea. */
  const insertAtCursor = (before: string, after = "", placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const next = `${value.slice(0, selectionStart)}${before}${selected}${after}${value.slice(selectionEnd)}`;

    set("content", next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + before.length,
        selectionStart + before.length + selected.length
      );
    });
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const image = await uploadImage(file);
      insertAtCursor(`![${file.name.replace(/\.[^.]+$/, "")}](${image.url})`, "", "");
      setNotice("Image uploaded and inserted.");
    } catch (caught) {
      setError(caught instanceof AdminApiError ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async (publish: boolean | null = null) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setNotice(null);

    const status = publish === null ? form.status : publish ? "published" : "draft";

    const body: Record<string, unknown> = {
      title: form.title.trim(),
      content: form.content,
      status,
      category: form.category.trim() || "Uncategorized",
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      excerpt: form.excerpt.trim(),
      coverImage: form.coverImage.trim(),
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      seriesId: form.seriesId || null,
      seriesOrder: form.seriesOrder ? Number(form.seriesOrder) : null,
    };
    if (form.slug.trim()) body.slug = form.slug.trim();

    try {
      if (post) {
        const updated = await updatePost(post._id, body);
        setForm(toFormState(updated));
        setNotice(`Saved${status === "published" ? " and published" : ""}.`);
      } else {
        const created = await createPost(body);
        router.replace(`/admin/posts/${created._id}`);
        return;
      }
    } catch (caught) {
      if (caught instanceof AdminApiError) {
        setError(caught.message);
        if (caught.fieldErrors) setFieldErrors(caught.fieldErrors);
      } else {
        setError("Could not save. Check that the API is reachable.");
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!post) return;
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    try {
      await deletePost(post._id);
      router.push("/admin/posts");
    } catch {
      setError("Could not delete this post.");
    }
  };

  const toolbar = [
    { label: "H2", title: "Heading 2", action: () => insertAtCursor("\n## ", "", "Heading") },
    { label: "B", title: "Bold", action: () => insertAtCursor("**", "**", "bold text") },
    { label: "I", title: "Italic", action: () => insertAtCursor("*", "*", "italic text") },
    { label: "Link", title: "Link", action: () => insertAtCursor("[", "](https://)", "text") },
    { label: "`Code`", title: "Inline code", action: () => insertAtCursor("`", "`", "code") },
    {
      label: "Block",
      title: "Code block",
      action: () => insertAtCursor("\n```python\n", "\n```\n", "# your code"),
    },
    { label: "$x$", title: "Inline math", action: () => insertAtCursor("$", "$", "O(n)") },
    {
      label: "$$",
      title: "Display math",
      action: () => insertAtCursor("\n$$\n", "\n$$\n", "T(n) = 2T(n/2) + O(n)"),
    },
    { label: "List", title: "Bullet list", action: () => insertAtCursor("\n- ", "", "item") },
    { label: "Quote", title: "Blockquote", action: () => insertAtCursor("\n> ", "", "quote") },
    {
      label: "Table",
      title: "Table",
      action: () =>
        insertAtCursor("\n| Column | Column |\n|---|---|\n| cell | cell |\n", "", ""),
    },
  ];

  return (
    <div>
      {/* Sticky action bar */}
      <div
        className="sticky top-14 z-30 -mx-5 mb-6 flex flex-wrap items-center gap-3 border-b px-5 py-3 backdrop-blur-md md:-mx-8 md:px-8"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--bg) 90%, transparent)",
        }}
      >
        <Link href="/admin/posts" className="u-meta hover:text-[var(--accent)]">
          ← Posts
        </Link>

        <span
          className={`status-pill ${form.status === "published" ? "status-published" : "status-draft"}`}
        >
          {form.status}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {post && form.status === "published" && (
            <Link
              href={`/blog/${form.slug}`}
              target="_blank"
              className="btn btn-secondary"
            >
              View ↗
            </Link>
          )}
          {post && (
            <button type="button" onClick={onDelete} className="btn btn-danger">
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={() => void save(false)}
            className="btn btn-secondary"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => void save(true)}
            className="btn btn-primary"
            disabled={saving}
          >
            {form.status === "published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border px-3 py-2.5 text-sm"
          style={{ borderColor: "#dc2626", color: "#dc2626" }}
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-md border px-3 py-2.5 text-sm"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          {notice}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column */}
        <div className="min-w-0">
          <div className="mb-5">
            <label htmlFor="title" className="field-label">
              Title
            </label>
            <input
              id="title"
              className="field-input"
              style={{ fontSize: "1.15rem", fontWeight: 600 }}
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="How B-trees actually work"
            />
            {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}
          </div>

          {/* Editor tabs */}
          <div className="mb-2 flex items-center gap-1 border-b" style={{ borderColor: "var(--border)" }}>
            {(["write", "preview"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                aria-pressed={tab === value}
                className="-mb-px border-b-2 px-3 py-2 text-sm capitalize transition-colors"
                style={{
                  borderColor: tab === value ? "var(--accent)" : "transparent",
                  color: tab === value ? "var(--fg)" : "var(--fg-muted)",
                  fontWeight: tab === value ? 550 : 400,
                }}
              >
                {value}
              </button>
            ))}
            <span className="ml-auto u-meta">
              {form.content.length.toLocaleString("en-GB")} chars
            </span>
          </div>

          {tab === "write" ? (
            <>
              <div className="mb-2 flex flex-wrap gap-1">
                {toolbar.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    title={item.title}
                    onClick={item.action}
                    className="rounded border px-2 py-1 font-mono text-xs transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded border px-2 py-1 font-mono text-xs transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                >
                  {uploading ? "Uploading…" : "Image"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onUpload(file);
                  }}
                />
              </div>

              <label htmlFor="content" className="sr-only">
                Post content in Markdown
              </label>
              <textarea
                id="content"
                ref={textareaRef}
                className="editor-textarea"
                value={form.content}
                onChange={(event) => set("content", event.target.value)}
                onDrop={(event) => {
                  const file = event.dataTransfer.files?.[0];
                  if (file?.type.startsWith("image/")) {
                    event.preventDefault();
                    void onUpload(file);
                  }
                }}
                placeholder={"# Start writing\n\nMarkdown, code fences and $\\LaTeX$ all work."}
                spellCheck
              />
              {fieldErrors.content && <p className="field-error">{fieldErrors.content}</p>}
              <p className="mt-2 u-meta">
                Supports GitHub-flavoured Markdown, fenced code blocks and KaTeX math. ⌘/Ctrl+S
                to save.
              </p>
            </>
          ) : (
            <div
              className="rounded-lg border p-6"
              style={{ borderColor: "var(--border)", background: "var(--bg-raised)", minHeight: "60vh" }}
            >
              <MarkdownPreview source={form.content} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <SidebarCard title="Publishing">
            <label htmlFor="status" className="field-label">
              Status
            </label>
            <select
              id="status"
              className="field-select"
              value={form.status}
              onChange={(event) => set("status", event.target.value as "draft" | "published")}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>

            <label htmlFor="slug" className="field-label mt-4">
              Slug
            </label>
            <input
              id="slug"
              className="field-input"
              value={form.slug}
              onChange={(event) => set("slug", event.target.value)}
              placeholder="auto-generated from title"
            />
            {fieldErrors.slug && <p className="field-error">{fieldErrors.slug}</p>}
          </SidebarCard>

          <SidebarCard title="Organisation">
            <label htmlFor="category" className="field-label">
              Category
            </label>
            <input
              id="category"
              className="field-input"
              value={form.category}
              onChange={(event) => set("category", event.target.value)}
              placeholder="Algorithms"
            />

            <label htmlFor="tags" className="field-label mt-4">
              Tags (comma separated)
            </label>
            <input
              id="tags"
              className="field-input"
              value={form.tags}
              onChange={(event) => set("tags", event.target.value)}
              placeholder="Sorting, Complexity"
            />

            <label htmlFor="series" className="field-label mt-4">
              Series
            </label>
            <select
              id="series"
              className="field-select"
              value={form.seriesId}
              onChange={(event) => set("seriesId", event.target.value)}
            >
              <option value="">— none —</option>
              {series.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.title}
                </option>
              ))}
            </select>

            {form.seriesId && (
              <>
                <label htmlFor="seriesOrder" className="field-label mt-4">
                  Part number
                </label>
                <input
                  id="seriesOrder"
                  type="number"
                  min={1}
                  className="field-input"
                  value={form.seriesOrder}
                  onChange={(event) => set("seriesOrder", event.target.value)}
                  placeholder="1"
                />
              </>
            )}
          </SidebarCard>

          <SidebarCard title="Presentation">
            <label htmlFor="excerpt" className="field-label">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              rows={3}
              className="field-textarea"
              value={form.excerpt}
              onChange={(event) => set("excerpt", event.target.value)}
              placeholder="Auto-generated from the first lines if left blank."
            />

            <label htmlFor="coverImage" className="field-label mt-4">
              Cover image URL
            </label>
            <input
              id="coverImage"
              className="field-input"
              value={form.coverImage}
              onChange={(event) => set("coverImage", event.target.value)}
              placeholder="https://…"
            />
            {form.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.coverImage}
                alt=""
                className="mt-3 w-full rounded border"
                style={{ borderColor: "var(--border)" }}
              />
            )}
          </SidebarCard>

          <SidebarCard title="SEO">
            <label htmlFor="seoTitle" className="field-label">
              Meta title
            </label>
            <input
              id="seoTitle"
              className="field-input"
              value={form.seoTitle}
              onChange={(event) => set("seoTitle", event.target.value)}
              placeholder="Defaults to the post title"
            />

            <label htmlFor="seoDescription" className="field-label mt-4">
              Meta description
            </label>
            <textarea
              id="seoDescription"
              rows={3}
              className="field-textarea"
              value={form.seoDescription}
              onChange={(event) => set("seoDescription", event.target.value)}
              placeholder="Defaults to the excerpt"
            />
            <p className="mt-1.5 u-meta">{form.seoDescription.length}/160 recommended</p>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
    >
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
