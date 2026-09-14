"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "@/components/delete-button";
import { Button, EmptyState, Input, Notice } from "@/components/ui";
import { PlusIcon } from "@/components/icons";

type Item = {
  id: string;
  secureUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  usageCount: number;
};

export default function MediaLibrary({ items }: { items: Item[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function upload(files: FileList) {
    setUploading(true);
    setError(null);

    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    form.append("folder", "library");

    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const json = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "Those photos could not be uploaded.");
      return;
    }
    router.refresh();
  }

  async function saveAlt(id: string, altText: string) {
    await fetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText }),
    });
    setOpenId(null);
    router.refresh();
  }

  const uploadButton = (
    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover">
      <PlusIcon className="size-4" />
      {uploading ? "Uploading…" : "Upload photos"}
      <input
        type="file"
        accept="image/*"
        multiple
        hidden
        disabled={uploading}
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
    </label>
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {uploadButton}
        <p className="text-sm text-muted">JPEG, PNG, WebP or AVIF, up to 8MB each.</p>
      </div>

      {error && <Notice className="mb-5">{error}</Notice>}

      {items.length === 0 ? (
        <EmptyState
          title="No photos yet"
          hint="Upload product and blog photos once, then pick them wherever you need them."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <li
              key={m.id}
              className="overflow-hidden rounded-xl border border-hairline bg-surface"
            >
              <Image
                src={m.secureUrl}
                alt={m.altText ?? ""}
                width={240}
                height={300}
                className="h-40 w-full bg-sunk object-cover"
              />
              <div className="space-y-1 p-3 text-xs">
                <p className={`truncate ${m.altText ? "text-ink" : "text-faint"}`}>
                  {m.altText || "No description"}
                </p>
                <p className="text-muted">
                  {m.width}×{m.height}
                  {m.bytes ? ` · ${Math.round(m.bytes / 1024)}KB` : ""}
                  {m.usageCount > 0 ? ` · used ${m.usageCount}×` : " · unused"}
                </p>

                {openId === m.id ? (
                  <form
                    className="flex gap-1.5 pt-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveAlt(m.id, String(new FormData(e.currentTarget).get("alt") ?? ""));
                    }}
                  >
                    <Input
                      name="alt"
                      autoFocus
                      aria-label="Photo description"
                      defaultValue={m.altText ?? ""}
                      className="px-2 py-1.5 text-xs"
                    />
                    <Button type="submit" size="sm" className="px-2.5 py-1.5 text-xs">
                      Save
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setOpenId(m.id)}
                      className="rounded px-1.5 py-1 font-medium text-primary hover:bg-primary-soft"
                    >
                      {m.altText ? "Edit description" : "Add description"}
                    </button>
                    <DeleteButton
                      endpoint={`/api/admin/media/${m.id}`}
                      label="Delete this photo"
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
