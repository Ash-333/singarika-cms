"use client";

import Image from "next/image";
import { useState } from "react";

export type MediaItem = {
  id: string;
  secureUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Picks images from the Cloudinary-backed library, with inline upload.
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
      setUploadError(json?.error?.message ?? "Upload failed");
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
          <div key={item.id} className="group relative">
            <Image
              src={item.secureUrl}
              alt={item.altText ?? ""}
              width={96}
              height={128}
              className="h-32 w-24 rounded-lg border border-stone-200 object-cover"
            />
            {i === 0 && multiple && (
              <span className="absolute left-1 top-1 rounded bg-pink-800 px-1.5 py-0.5 text-[10px] text-white">
                Main
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between rounded-b-lg bg-black/60 px-1 py-0.5 opacity-0 transition group-hover:opacity-100">
              {multiple ? (
                <>
                  <button type="button" onClick={() => move(i, -1)} className="text-xs text-white">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, 1)} className="text-xs text-white">
                    →
                  </button>
                </>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s.id !== item.id))}
                className="text-xs text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={openPicker}
          className="flex h-32 w-24 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 text-xs text-stone-500 hover:border-pink-400 hover:text-pink-700"
        >
          <span className="text-lg">+</span>
          Add image
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
              <h3 className="font-medium">Media library</h3>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-lg bg-pink-800 px-3 py-1.5 text-sm text-white hover:bg-pink-900">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    hidden
                    onChange={(e) => e.target.files && upload(e.target.files)}
                  />
                </label>
                <button type="button" onClick={() => setOpen(false)} className="text-stone-500">
                  Close
                </button>
              </div>
            </div>

            {uploadError && (
              <p className="bg-rose-50 px-5 py-2 text-sm text-rose-700">{uploadError}</p>
            )}

            <div className="max-h-[60vh] overflow-y-auto p-5">
              {loading && <p className="text-sm text-stone-500">Loading…</p>}
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {library.map((item) => {
                  const isSelected = selected.some((s) => s.id === item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggle(item)}
                      className={`overflow-hidden rounded-lg border-2 transition ${
                        isSelected ? "border-pink-700" : "border-transparent hover:border-stone-300"
                      }`}
                    >
                      <Image
                        src={item.secureUrl}
                        alt={item.altText ?? ""}
                        width={120}
                        height={160}
                        className="h-28 w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
              {!loading && library.length === 0 && (
                <p className="text-sm text-stone-500">
                  Nothing uploaded yet — use the Upload button above.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
