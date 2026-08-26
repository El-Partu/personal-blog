"use client";

import AdminShell from "@/components/admin/AdminShell";
import PostEditor from "@/components/admin/PostEditor";

export default function NewPostPage() {
  return (
    <AdminShell>
      <PostEditor />
    </AdminShell>
  );
}
