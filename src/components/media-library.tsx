"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "@/components/delete-button";
import { EmptyState } from "@/components/ui";

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
      setError(json?.error?.message ?? "Upload failed");
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

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label className="cursor-pointer rounded-lg bg-pink-800 px-4 py-2 text-sm font-medium text-white hover:bg-pink-900">
          {uploading ? "Uploading…" : "Upload images"}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={uploading}
            onChange={(e) => e.target.files && upload(e.target.files)}
          />
        </label>
        <p className="text-sm text-stone-500">JPEG, PNG, WebP or AVIF up to 8MB each.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {items.length === 0 ? (
        <EmptyState title="No images yet" hint="Upload product or blog imagery to get started." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl border border-stone-200 bg-white p-2">
              <Image
                src={m.secureUrl}
                alt={m.altText ?? ""}
                width={200}
                height={260}
                className="h-40 w-full rounded-lg object-cover"
              />
              <div className="px-1 pb-1 pt-2 text-xs text-stone-500">
                <p className="truncate">{m.altText || "No alt text"}</p>
                <p className="mt-0.5 text-stone-400">
                  {m.width}×{m.height} · {m.bytes ? `${Math.round(m.bytes / 1024)}KB` : "—"}
                  {m.usageCount > 0 && ` · used ${m.usageCount}×`}
                </p>

                {openId === m.id ? (
                  <form
                    className="mt-2 flex gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveAlt(m.id, String(new FormData(e.currentTarget).get("alt") ?? ""));
                    }}
                  >
                    <input
                      name="alt"
                      defaultValue={m.altText ?? ""}
                      className="w-full rounded border border-stone-300 px-1.5 py-1"
                    />
                    <button type="submit" className="text-pink-800">
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setOpenId(m.id)}
                      className="text-pink-800 hover:underline"
                    >
                      Alt text
                    </button>
                    <DeleteButton endpoint={`/api/admin/media/${m.id}`} label="Delete image?" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
