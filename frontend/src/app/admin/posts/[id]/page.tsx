"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Post } from "@blog/shared";
import AdminShell from "@/components/admin/AdminShell";
import PostEditor from "@/components/admin/PostEditor";
import { getPost } from "@/lib/adminClient";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    getPost(params.id)
      .then(setPost)
      .catch(() => setError("Could not load this post."));
  }, [params?.id]);

  return (
    <AdminShell>
      {error ? (
        <p role="alert" className="py-16 text-center" style={{ color: "#dc2626" }}>
          {error}
        </p>
      ) : !post ? (
        <p className="u-meta py-16 text-center">Loading…</p>
      ) : (
        <PostEditor post={post} />
      )}
    </AdminShell>
  );
}
