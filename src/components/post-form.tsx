"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/rich-text-editor";
import MediaPicker, { type MediaItem } from "@/components/media-picker";
import { Button, Field, Input, Notice, Section, Select, Textarea } from "@/components/ui";

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

  const words = draft.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

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
      setError(json?.error?.message ?? "The post could not be saved.");
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
    >
      <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-3 border-b border-hairline bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <label htmlFor="post-status" className="text-sm text-muted">
          Status
        </label>
        <Select
          id="post-status"
          value={draft.status}
          onChange={(e) => set("status", e.target.value as PostDraft["status"])}
          className="w-auto py-2"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <span className="hidden text-sm text-muted sm:inline">
          {words} word{words === 1 ? "" : "s"}
        </span>

        <div className="ml-auto flex gap-2">
          {draft.status !== "PUBLISHED" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => save("PUBLISHED")}
            >
              Publish now
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : draft.id ? "Save changes" : "Create post"}
          </Button>
        </div>

        {error && (
          <Notice className="w-full" tone="error">
            {error}
          </Notice>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Section title="Headline" description="What readers see in the blog listing.">
            <div className="space-y-4">
              <Field label="Title" required>
                {(id) => (
                  <Input
                    id={id}
                    required
                    value={draft.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="How to tie a patuka over a Dhaka kurtha"
                  />
                )}
              </Field>
              <Field
                label="Web address"
                hint={
                  draft.slug
                    ? `singarika.com/blog/${draft.slug}`
                    : "Left blank, this is built from the title."
                }
              >
                {(id) => (
                  <Input
                    id={id}
                    value={draft.slug}
                    onChange={(e) => set("slug", e.target.value)}
                  />
                )}
              </Field>
              <Field label="Summary" hint="Two lines at most — it appears under the title.">
                {(id) => (
                  <Textarea
                    id={id}
                    rows={2}
                    value={draft.excerpt}
                    onChange={(e) => set("excerpt", e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Section>

          <Section title="Story">
            <RichTextEditor value={draft.content} onChange={(html) => set("content", html)} />
          </Section>

          <Section
            title="Google listing"
            description="Left empty, the title and summary are used."
          >
            <div className="space-y-4">
              <Field label="Page title">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.metaTitle}
                    onChange={(e) => set("metaTitle", e.target.value)}
                    maxLength={70}
                  />
                )}
              </Field>
              <Field label="Page description">
                {(id) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={draft.metaDescription}
                    onChange={(e) => set("metaDescription", e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Cover photo" description="Shown at the top of the post and in listings.">
            <MediaPicker
              selected={draft.coverImage}
              onChange={(items) => set("coverImage", items)}
              multiple={false}
              folder="blog"
            />
          </Section>

          <Section title="Filing">
            <div className="space-y-4">
              <Field label="Category">
                {(id) => (
                  <Select
                    id={id}
                    value={draft.categoryId}
                    onChange={(e) => set("categoryId", e.target.value)}
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Tags" hint="Separate with commas.">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="dhaka, dashain, styling"
                  />
                )}
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </form>
  );
}
