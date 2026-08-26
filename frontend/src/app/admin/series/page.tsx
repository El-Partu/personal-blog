"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Series } from "@blog/shared";
import AdminShell from "@/components/admin/AdminShell";
import {
  AdminApiError,
  createSeries,
  deleteSeries,
  listSeries,
  updateSeries,
} from "@/lib/adminClient";

type SeriesRow = Series & { postCount: number };

export default function AdminSeriesPage() {
  const [rows, setRows] = useState<SeriesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "" });

  const load = useCallback(() => {
    setLoading(true);
    listSeries()
      .then(setRows)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await createSeries({ title: title.trim(), description: description.trim() });
      setTitle("");
      setDescription("");
      load();
    } catch (caught) {
      setError(caught instanceof AdminApiError ? caught.message : "Could not create series.");
    }
  };

  const onSaveEdit = async (id: string) => {
    try {
      await updateSeries(id, { title: draft.title, description: draft.description });
      setEditingId(null);
      load();
    } catch {
      setError("Could not update series.");
    }
  };

  const onDelete = async (row: SeriesRow) => {
    if (
      !window.confirm(
        `Delete “${row.title}”? Its ${row.postCount} post(s) will be detached but not deleted.`
      )
    )
      return;
    await deleteSeries(row._id).catch(() => undefined);
    load();
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold tracking-tight">Series</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
        Group multi-part write-ups. Set each post&apos;s part number in the post editor.
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

      <form
        onSubmit={onCreate}
        className="mt-6 rounded-lg border p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
      >
        <h2 className="mb-3 text-sm font-semibold">New series</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <div>
            <label htmlFor="series-title" className="field-label">
              Title
            </label>
            <input
              id="series-title"
              className="field-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Operating Systems Notes"
              required
            />
          </div>
          <div>
            <label htmlFor="series-description" className="field-label">
              Description
            </label>
            <input
              id="series-description"
              className="field-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What the series covers"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </div>
      </form>

      <div className="mt-8">
        {loading ? (
          <p className="u-meta">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            No series yet.
          </p>
        ) : (
          <ul
            className="divide-y overflow-hidden rounded-lg border"
            style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
          >
            {rows.map((row) => (
              <li key={row._id} className="p-4">
                {editingId === row._id ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                    <input
                      className="field-input"
                      value={draft.title}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      aria-label="Series title"
                    />
                    <input
                      className="field-input"
                      value={draft.description}
                      onChange={(event) =>
                        setDraft({ ...draft, description: event.target.value })
                      }
                      aria-label="Series description"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void onSaveEdit(row._id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{row.title}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
                        {row.description || "No description"}
                      </p>
                      <p className="mt-1.5 u-meta">
                        /series/{row.slug} · {row.postCount}{" "}
                        {row.postCount === 1 ? "post" : "posts"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingId(row._id);
                          setDraft({ title: row.title, description: row.description });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => void onDelete(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
