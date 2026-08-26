"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Tag } from "@blog/shared";
import AdminShell from "@/components/admin/AdminShell";
import { AdminApiError, createTag, deleteTag, listTags } from "@/lib/adminClient";

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    listTags()
      .then(setTags)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await createTag(name.trim());
      setName("");
      load();
    } catch (caught) {
      setError(caught instanceof AdminApiError ? caught.message : "Could not create tag.");
    }
  };

  const onDelete = async (tag: Tag) => {
    if (!window.confirm(`Delete the tag “${tag.name}”? Posts keep the tag text.`)) return;
    await deleteTag(tag._id).catch(() => undefined);
    load();
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
        Tags are created automatically when you use them on a post. Add them here to
        pre-populate the list.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border px-3 py-2.5 text-sm"
          style={{ borderColor: "#dc2626", color: "#dc2626" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={onCreate} className="mt-6 flex max-w-md gap-2">
        <div className="flex-1">
          <label htmlFor="tag-name" className="sr-only">
            Tag name
          </label>
          <input
            id="tag-name"
            className="field-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Graph Theory"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add tag
        </button>
      </form>

      <div className="mt-8">
        {loading ? (
          <p className="u-meta">Loading…</p>
        ) : tags.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            No tags yet.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag._id}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
              >
                <span>{tag.name}</span>
                <span className="u-meta">{tag.postCount ?? 0}</span>
                <button
                  type="button"
                  onClick={() => void onDelete(tag)}
                  aria-label={`Delete tag ${tag.name}`}
                  className="ml-1 transition-colors hover:text-[#dc2626]"
                  style={{ color: "var(--fg-subtle)" }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
