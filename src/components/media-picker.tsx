"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, Notice } from "@/components/ui";
import { CloseIcon, PlusIcon } from "@/components/icons";

export type MediaItem = {
  id: string;
  secureUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Picks photos from the Cloudinary-backed library, with inline upload.
 * `multiple` drives product galleries; single mode drives cover images.
 */
export default function MediaPicker({
  selected,
  onChange,
  multiple = true,
  folder = "uploads",
}: {
  selected: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  multiple?: boolean;
  folder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The library is fetched when the picker is opened rather than from an
  // effect, so opening is a single render pass.
  async function openPicker() {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media?perPage=60");
      const json = await res.json();
      setLibrary(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function upload(files: FileList) {
    setUploadError(null);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    form.append("folder", folder);

    setLoading(true);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setUploadError(json?.error?.message ?? "Those photos could not be uploaded.");
      return;
    }
    setLibrary((prev) => [...json.data, ...prev]);
    onChange(multiple ? [...selected, ...json.data] : [json.data[0]]);
  }

  function toggle(item: MediaItem) {
    if (!multiple) {
      onChange([item]);
      setOpen(false);
      return;
    }
    const exists = selected.some((s) => s.id === item.id);
    onChange(exists ? selected.filter((s) => s.id !== item.id) : [...selected, item]);
  }

  function move(index: number, delta: number) {
    const next = [...selected];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {selected.map((item, i) => (
          <div key={item.id} className="relative">
            <Image
              src={item.secureUrl}
              alt={item.altText ?? ""}
              width={96}
              height={128}
              className="h-32 w-24 rounded-lg border border-hairline bg-sunk object-cover"
            />
            {i === 0 && multiple && selected.length > 1 && (
              <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[0.625rem] font-medium text-white">
                Main
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-lg bg-ink/70 px-1 py-1">
              {multiple ? (
                <span className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    aria-label="Move photo earlier"
                    disabled={i === 0}
                    className="rounded px-1.5 text-white disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    aria-label="Move photo later"
                    disabled={i === selected.length - 1}
                    className="rounded px-1.5 text-white disabled:opacity-40"
                  >
                    →
                  </button>
                </span>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s.id !== item.id))}
                aria-label="Remove photo"
                className="rounded p-0.5 text-white"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={openPicker}
          className="flex h-32 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-hairline-strong text-xs text-muted transition hover:border-primary hover:bg-primary-soft hover:text-primary"
        >
          <PlusIcon className="size-5" />
          {selected.length === 0 ? "Add photo" : "Add more"}
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo library"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
        >
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
              <h3 className="font-display text-lg text-ink">Photo library</h3>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover">
                  Upload new
                  <input
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    hidden
                    onChange={(e) => e.target.files && upload(e.target.files)}
                  />
                </label>
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </div>

            {uploadError && (
              <Notice className="m-4 mb-0">{uploadError}</Notice>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              {loading && <p className="text-sm text-muted">Loading photos…</p>}
              {!loading && library.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  The library is empty. Use “Upload new” to add the first photo.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {library.map((item) => {
                    const isSelected = selected.some((s) => s.id === item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggle(item)}
                        aria-pressed={isSelected}
                        className={`overflow-hidden rounded-lg border-2 transition ${
                          isSelected
                            ? "border-primary ring-2 ring-primary-soft"
                            : "border-transparent hover:border-hairline-strong"
                        }`}
                      >
                        <Image
                          src={item.secureUrl}
                          alt={item.altText ?? ""}
                          width={160}
                          height={200}
                          className="h-28 w-full bg-sunk object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
