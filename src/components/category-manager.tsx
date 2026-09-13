"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker, { type MediaItem } from "@/components/media-picker";
import { Badge, Card } from "@/components/ui";
import DeleteButton from "@/components/delete-button";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  parentName: string | null;
  position: number;
  isActive: boolean;
  productCount: number;
  childCount: number;
  image: MediaItem | null;
};

const field =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-pink-700 focus:outline-none";

export default function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    position: "0",
    isActive: true,
  });
  const [image, setImage] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const roots = categories.filter((c) => !c.parentId);

  function startEdit(c: CategoryRow) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId ?? "",
      position: String(c.position),
      isActive: c.isActive,
    });
    setImage(c.image ? [c.image] : []);
    setError(null);
  }

  function reset() {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", parentId: "", position: "0", isActive: true });
    setImage([]);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || null,
      parentId: form.parentId || null,
      position: Number(form.position || 0),
      isActive: form.isActive,
      imageId: image[0]?.id ?? null,
    };

    const res = await fetch(
      editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "Could not save the category");
      return;
    }
    reset();
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {categories.length === 0 ? (
          <Card>
            <p className="text-sm text-stone-500">
              No categories yet. Create your first one — try “Sarees”.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          <Image
                            src={c.image.secureUrl}
                            alt={c.name}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded bg-stone-100" />
                        )}
                        <span>
                          {c.parentName && (
                            <span className="text-stone-400">{c.parentName} › </span>
                          )}
                          <span className="font-medium">{c.name}</span>
                          <span className="block text-xs text-stone-400">/{c.slug}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-stone-500">{c.productCount}</td>
                    <td className="px-4 py-3">
                      <Badge tone={c.isActive ? "ACTIVE" : "ARCHIVED"}>
                        {c.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="mr-3 text-sm text-pink-800 hover:underline"
                      >
                        Edit
                      </button>
                      <DeleteButton
                        endpoint={`/api/admin/categories/${c.id}`}
                        label={`Delete ${c.name}?`}
                        onDone={reset}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Card>
        <h2 className="mb-4 font-medium">{editing ? `Edit ${editing.name}` : "New category"}</h2>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-generated"
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Parent</label>
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className={field}
            >
              <option value="">Top level</option>
              {roots
                .filter((r) => r.id !== editing?.id)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sort position</label>
            <input
              type="number"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Image</label>
            <MediaPicker
              selected={image}
              onChange={setImage}
              multiple={false}
              folder="categories"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Visible on the storefront
          </label>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-pink-800 px-4 py-2 text-sm font-medium text-white hover:bg-pink-900 disabled:opacity-60"
            >
              {pending ? "Saving…" : editing ? "Update" : "Create"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
