"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UploadedImage } from "@blog/shared";
import AdminShell from "@/components/admin/AdminShell";
import { AdminApiError, deleteImage, listImages, uploadImage } from "@/lib/adminClient";

export default function AdminMediaPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    listImages()
      .then(setImages)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadImage(file);
      }
      load();
    } catch (caught) {
      setError(caught instanceof AdminApiError ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copyMarkdown = async (image: UploadedImage) => {
    const markdown = `![](${image.url})`;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(image.publicId ?? image.url);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const onDelete = async (image: UploadedImage) => {
    if (!image.publicId) return;
    if (!window.confirm("Delete this image?")) return;
    await deleteImage(image.publicId).catch(() => undefined);
    load();
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold tracking-tight">Media</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
        Uploads go to Cloudinary when it&apos;s configured, otherwise to the backend&apos;s local{" "}
        <code>uploads/</code> folder.
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

      <div
        className="mt-6 rounded-lg border border-dashed p-8 text-center"
        style={{ borderColor: "var(--border-strong)" }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onUpload(event.dataTransfer.files);
        }}
      >
        <p className="text-sm font-medium">Drop images here</p>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          or
        </p>
        <button
          type="button"
          className="btn btn-primary mt-3"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Choose files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => void onUpload(event.target.files)}
        />
        <p className="mt-3 u-meta">PNG, JPG, GIF, WebP or SVG · max 5 MB each</p>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="u-meta">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            No images uploaded yet.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <li
                key={image.publicId ?? image.url}
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                  style={{ background: "var(--bg-subtle)" }}
                />
                <div className="p-2.5">
                  <p className="truncate text-xs" style={{ color: "var(--fg-muted)" }}>
                    {image.publicId ?? image.url}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      className="btn btn-secondary flex-1"
                      style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                      onClick={() => void copyMarkdown(image)}
                    >
                      {copied === (image.publicId ?? image.url) ? "Copied!" : "Copy MD"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem" }}
                      onClick={() => void onDelete(image)}
                      aria-label="Delete image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
