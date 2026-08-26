"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AdminApiError, getToken, login, setToken } from "@/lib/adminClient";
import { site } from "@/lib/site";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    if (getToken()) router.replace("/admin");
  }, [router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await login(email, password);
      setToken(result.token);
      router.replace("/admin");
    } catch (caught) {
      setError(
        caught instanceof AdminApiError
          ? caught.message
          : "Could not reach the API. Is the backend running?"
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="u-meta hover:text-[var(--accent)]">
          ← Back to {site.name}
        </Link>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          Admin access for the single author account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="rounded-md border px-3 py-2.5 text-sm"
              style={{ borderColor: "#dc2626", color: "#dc2626" }}
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p
          className="mt-6 rounded-md border border-dashed p-3 text-xs leading-relaxed"
          style={{ borderColor: "var(--border-strong)", color: "var(--fg-subtle)" }}
        >
          Default seeded credentials are <code>admin@example.com</code> /{" "}
          <code>ChangeMe123!</code> — set <code>ADMIN_EMAIL</code> and{" "}
          <code>ADMIN_PASSWORD</code> in the backend <code>.env</code> and re-run the seed to
          change them.
        </p>
      </div>
    </div>
  );
}
