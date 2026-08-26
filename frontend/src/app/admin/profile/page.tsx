"use client";

import { useEffect, useState, type FormEvent } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { AdminApiError, fetchMe, updateProfile } from "@/lib/adminClient";

export default function AdminProfilePage() {
  const [form, setForm] = useState({ name: "", bio: "", avatarUrl: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) =>
        setForm({
          name: me.name ?? "",
          bio: me.bio ?? "",
          avatarUrl: me.avatarUrl ?? "",
          email: me.email,
        })
      )
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateProfile({
        name: form.name.trim(),
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim(),
      });
      setNotice("Profile saved. The About page will update shortly.");
    } catch (caught) {
      setError(caught instanceof AdminApiError ? caught.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
        This is the author information shown on the public About page.
      </p>

      {loading ? (
        <p className="u-meta mt-6">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 max-w-lg space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md border px-3 py-2.5 text-sm"
              style={{ borderColor: "#dc2626", color: "#dc2626" }}
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="rounded-md border px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              {notice}
            </div>
          )}

          <div>
            <label htmlFor="email" className="field-label">
              Email (sign-in address)
            </label>
            <input id="email" className="field-input" value={form.email} disabled readOnly />
            <p className="mt-1.5 u-meta">
              Change via ADMIN_EMAIL in the backend .env, then re-run the seed script.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="field-label">
              Display name
            </label>
            <input
              id="name"
              className="field-input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>

          <div>
            <label htmlFor="bio" className="field-label">
              Bio
            </label>
            <textarea
              id="bio"
              rows={5}
              className="field-textarea"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              placeholder="Who you are and what you're studying."
            />
          </div>

          <div>
            <label htmlFor="avatarUrl" className="field-label">
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              className="field-input"
              value={form.avatarUrl}
              onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })}
              placeholder="https://…"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      )}
    </AdminShell>
  );
}
