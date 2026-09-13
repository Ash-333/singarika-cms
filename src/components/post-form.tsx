"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/rich-text-editor";
import MediaPicker, { type MediaItem } from "@/components/media-picker";
import { Card } from "@/components/ui";

export type PostDraft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  coverImage: MediaItem[];
};

const field =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-pink-700 focus:outline-none";
const labelCls = "mb-1 block text-sm font-medium text-stone-700";

export default function PostForm({
  initial,
  categories,
}: {
  initial: PostDraft;
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof PostDraft>(k: K, v: PostDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  async function save(status?: PostDraft["status"]) {
    setPending(true);
    setError(null);

    const payload = {
      title: draft.title,
      slug: draft.slug || undefined,
      excerpt: draft.excerpt || null,
      content: draft.content,
      status: status ?? draft.status,
      categoryId: draft.categoryId || null,
      coverImageId: draft.coverImage[0]?.id ?? null,
      tagNames: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      metaTitle: draft.metaTitle || null,
      metaDescription: draft.metaDescription || null,
    };

    const res = await fetch(draft.id ? `/api/admin/posts/${draft.id}` : "/api/admin/posts", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "Could not save the post");
      return;
    }
    router.push(`/blog/${json.data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid gap-5 lg:grid-cols-3"
    >
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <input
                required
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="How to drape a Kanjivaram saree"
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input
                value={draft.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="auto-generated from the title"
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Excerpt</label>
              <textarea
                rows={2}
                value={draft.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                className={field}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-medium">Content</h2>
          <RichTextEditor value={draft.content} onChange={(html) => set("content", html)} />
        </Card>

        <Card>
          <h2 className="mb-4 font-medium">Search engine listing</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Meta title</label>
              <input
                value={draft.metaTitle}
                onChange={(e) => set("metaTitle", e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Meta description</label>
              <textarea
                rows={3}
                value={draft.metaDescription}
                onChange={(e) => set("metaDescription", e.target.value)}
                className={field}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <h2 className="mb-4 font-medium">Publish</h2>
          <label className={labelCls}>Status</label>
          <select
            value={draft.status}
            onChange={(e) => set("status", e.target.value as PostDraft["status"])}
            className={field}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {error && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-pink-800 px-4 py-2 text-sm font-medium text-white hover:bg-pink-900 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            {draft.status !== "PUBLISHED" && (
              <button
                type="button"
                onClick={() => save("PUBLISHED")}
                disabled={pending}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-60"
              >
                Publish
              </button>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-medium">Cover image</h2>
          <MediaPicker
            selected={draft.coverImage}
            onChange={(items) => set("coverImage", items)}
            multiple={false}
            folder="blog"
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-medium">Organisation</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Category</label>
              <select
                value={draft.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className={field}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input
                value={draft.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="saree, styling, festive"
                className={field}
              />
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
