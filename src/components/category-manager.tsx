"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker, { type MediaItem } from "@/components/media-picker";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Input,
  Notice,
  Section,
  Select,
  Textarea,
} from "@/components/ui";
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

const blank = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  position: "0",
  isActive: true,
};

export default function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState(blank);
  const [image, setImage] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const roots = categories.filter((c) => !c.parentId);

  // Render parents with their children beneath them, so the shop menu is legible.
  const ordered = roots.flatMap((root) => [
    root,
    ...categories.filter((c) => c.parentId === root.id),
  ]);
  const orphans = categories.filter(
    (c) => c.parentId && !roots.some((r) => r.id === c.parentId),
  );
  const rows = [...ordered, ...orphans];

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
    setForm(blank);
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
      setError(json?.error?.message ?? "The category could not be saved.");
      return;
    }
    reset();
    router.refresh();
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {rows.length === 0 ? (
          <EmptyState
            title="Build the shop menu"
            hint="Start with a top-level group such as Kurtha Suruwal or Sari, then add the styles beneath it."
          />
        ) : (
          <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-surface">
            {rows.map((c) => (
              <li
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 transition hover:bg-sunk ${
                  c.parentId ? "pl-10" : ""
                }`}
              >
                {c.image ? (
                  <Image
                    src={c.image.secureUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="size-9 shrink-0 rounded bg-sunk" />
                )}

                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate ${
                      c.parentId ? "text-ink" : "font-medium text-ink"
                    }`}
                  >
                    {c.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    /{c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"}
                    {c.childCount > 0 && ` · ${c.childCount} sub-categories`}
                  </span>
                </span>

                {!c.isActive && <Badge tone="HIDDEN">Hidden</Badge>}

                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary-soft"
                >
                  Edit
                </button>
                <DeleteButton
                  endpoint={`/api/admin/categories/${c.id}`}
                  label={`Delete ${c.name}`}
                  onDone={reset}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Section
        title={editing ? `Edit ${editing.name}` : "Add a category"}
        description={
          editing ? "Changes appear on the storefront immediately." : "Two levels deep at most."
        }
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Name" required>
            {(id) => (
              <Input
                id={id}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Dhaka Kurtha Suruwal"
              />
            )}
          </Field>

          <Field label="Sits under">
            {(id) => (
              <Select
                id={id}
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">Top level</option>
                {roots
                  .filter((r) => r.id !== editing?.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </Select>
            )}
          </Field>

          <Field label="Web address" hint="Left blank, this is built from the name.">
            {(id) => (
              <Input
                id={id}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            )}
          </Field>

          <Field label="Description">
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            )}
          </Field>

          <Field label="Order in the menu" hint="Lower numbers come first.">
            {(id) => (
              <Input
                id={id}
                type="number"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            )}
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-soft">Photo</p>
            <MediaPicker
              selected={image}
              onChange={setImage}
              multiple={false}
              folder="categories"
            />
          </div>

          <Checkbox
            label="Show on the storefront"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />

          {error && <Notice>{error}</Notice>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={pending} className="flex-1">
              {pending ? "Saving…" : editing ? "Save changes" : "Add category"}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" size="sm" onClick={reset}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Section>
    </div>
  );
}
