"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker, { type MediaItem } from "@/components/media-picker";
import { Card } from "@/components/ui";

export type VariantDraft = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  optionLabel: string;
  optionValue: string;
  price: string;
  weightGram: string;
  stock: string;
  lowStockAlert: string;
  allowBackorder: boolean;
  isActive: boolean;
};

export type ProductDraft = {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  basePrice: string;
  compareAtPrice: string;
  costPrice: string;
  fabric: string;
  workType: string;
  occasion: string;
  color: string;
  pattern: string;
  careInstructions: string;
  brand: string;
  hsnCode: string;
  taxRatePct: string;
  metaTitle: string;
  metaDescription: string;
  categoryIds: string[];
  tags: string;
  images: MediaItem[];
  variants: VariantDraft[];
};

export const emptyVariant = (): VariantDraft => ({
  sku: "",
  size: "",
  color: "",
  optionLabel: "",
  optionValue: "",
  price: "",
  weightGram: "",
  stock: "0",
  lowStockAlert: "3",
  allowBackorder: false,
  isActive: true,
});

const FABRICS = ["Silk", "Cotton", "Georgette", "Chiffon", "Banarasi Silk", "Kanjivaram Silk", "Linen", "Organza", "Velvet", "Rayon"];
const OCCASIONS = ["Bridal", "Festive", "Wedding", "Party", "Casual", "Office", "Daily Wear"];
const WORK_TYPES = ["Zari", "Zardozi", "Chikankari", "Mirror Work", "Block Print", "Embroidery", "Sequin", "Bandhani", "Handloom", "Plain"];

const field =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-pink-700 focus:outline-none";
const labelCls = "mb-1 block text-sm font-medium text-stone-700";

export default function ProductForm({
  initial,
  categories,
}: {
  initial: ProductDraft;
  categories: Array<{ id: string; name: string; parentName?: string | null }>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setVariant = (index: number, patch: Partial<VariantDraft>) =>
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  async function save(status?: ProductDraft["status"]) {
    setPending(true);
    setError(null);

    const payload = {
      name: draft.name,
      slug: draft.slug || undefined,
      shortDescription: draft.shortDescription || null,
      description: draft.description || null,
      status: status ?? draft.status,
      isFeatured: draft.isFeatured,
      basePrice: Number(draft.basePrice || 0),
      compareAtPrice: num(draft.compareAtPrice),
      costPrice: num(draft.costPrice),
      fabric: draft.fabric || null,
      workType: draft.workType || null,
      occasion: draft.occasion || null,
      color: draft.color || null,
      pattern: draft.pattern || null,
      careInstructions: draft.careInstructions || null,
      brand: draft.brand || null,
      hsnCode: draft.hsnCode || null,
      taxRatePct: Number(draft.taxRatePct || 5),
      metaTitle: draft.metaTitle || null,
      metaDescription: draft.metaDescription || null,
      categoryIds: draft.categoryIds,
      tagNames: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      images: draft.images.map((m, i) => ({ mediaId: m.id, altText: m.altText, position: i })),
      variants: draft.variants.map((v, i) => ({
        ...(v.id ? { id: v.id } : {}),
        sku: v.sku,
        size: v.size || null,
        color: v.color || null,
        optionLabel: v.optionLabel || null,
        optionValue: v.optionValue || null,
        price: num(v.price),
        weightGram: num(v.weightGram),
        stock: Number(v.stock || 0),
        lowStockAlert: Number(v.lowStockAlert || 0),
        allowBackorder: v.allowBackorder,
        isActive: v.isActive,
        position: i,
      })),
    };

    const res = await fetch(
      draft.id ? `/api/admin/products/${draft.id}` : "/api/admin/products",
      {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "Could not save the product");
      return;
    }
    router.push(`/products/${json.data.id}`);
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
          <h2 className="mb-4 font-medium">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Product name</label>
              <input
                required
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Kanjivaram Silk Saree with Zari Border"
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>URL slug</label>
              <input
                value={draft.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="left blank, generated from the name"
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Short description</label>
              <input
                value={draft.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Full description</label>
              <textarea
                rows={6}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                className={field}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium">Images</h2>
          <MediaPicker
            selected={draft.images}
            onChange={(images) => set("images", images)}
            folder="products"
          />
          <p className="mt-2 text-xs text-stone-400">
            The first image is used as the product thumbnail on the storefront.
          </p>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Variants &amp; stock</h2>
            <button
              type="button"
              onClick={() => set("variants", [...draft.variants, emptyVariant()])}
              className="text-sm font-medium text-pink-800 hover:underline"
            >
              + Add variant
            </button>
          </div>

          {draft.id && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Stock for existing variants is changed on the Inventory page so every
              movement is recorded in the ledger.
            </p>
          )}

          <div className="space-y-3">
            {draft.variants.map((v, i) => (
              <div key={v.id ?? i} className="rounded-lg border border-stone-200 p-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs text-stone-500">SKU</label>
                    <input
                      required
                      value={v.sku}
                      onChange={(e) => setVariant(i, { sku: e.target.value })}
                      placeholder="SAR-KJV-RED-FS"
                      className={field}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-stone-500">Size</label>
                    <input
                      value={v.size}
                      onChange={(e) => setVariant(i, { size: e.target.value })}
                      placeholder="Free Size / M"
                      className={field}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-stone-500">Colour</label>
                    <input
                      value={v.color}
                      onChange={(e) => setVariant(i, { color: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-stone-500">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={v.price}
                      onChange={(e) => setVariant(i, { price: e.target.value })}
                      placeholder="base price"
                      className={field}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-stone-500">
                      Stock {v.id && <span className="text-stone-400">(read-only)</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      disabled={Boolean(v.id)}
                      onChange={(e) => setVariant(i, { stock: e.target.value })}
                      className={`${field} disabled:bg-stone-100 disabled:text-stone-500`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-stone-500">Low stock alert</label>
                    <input
                      type="number"
                      min="0"
                      value={v.lowStockAlert}
                      onChange={(e) => setVariant(i, { lowStockAlert: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-stone-500">Weight (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={v.weightGram}
                      onChange={(e) => setVariant(i, { weightGram: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div className="flex items-end gap-4 text-xs text-stone-600">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={v.isActive}
                        onChange={(e) => setVariant(i, { isActive: e.target.checked })}
                      />
                      Active
                    </label>
                    {draft.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          set("variants", draft.variants.filter((_, idx) => idx !== i))
                        }
                        className="text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium">Search engine listing</h2>
          <div className="space-y-4">
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
            onChange={(e) => set("status", e.target.value as ProductDraft["status"])}
            className={field}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
            />
            Feature on the homepage
          </label>

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
            {draft.status !== "ACTIVE" && (
              <button
                type="button"
                onClick={() => save("ACTIVE")}
                disabled={pending}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-60"
              >
                Publish
              </button>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium">Pricing</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Selling price (₹)</label>
              <input
                required
                type="number"
                min="0"
                value={draft.basePrice}
                onChange={(e) => set("basePrice", e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Compare-at price (₹)</label>
              <input
                type="number"
                min="0"
                value={draft.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Cost price (₹)</label>
              <input
                type="number"
                min="0"
                value={draft.costPrice}
                onChange={(e) => set("costPrice", e.target.value)}
                className={field}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>GST %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={draft.taxRatePct}
                  onChange={(e) => set("taxRatePct", e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={labelCls}>HSN code</label>
                <input
                  value={draft.hsnCode}
                  onChange={(e) => set("hsnCode", e.target.value)}
                  className={field}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium">Categories</h2>
          <div className="max-h-56 space-y-1.5 overflow-y-auto text-sm">
            {categories.length === 0 && (
              <p className="text-stone-500">No categories yet — create some first.</p>
            )}
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.categoryIds.includes(c.id)}
                  onChange={(e) =>
                    set(
                      "categoryIds",
                      e.target.checked
                        ? [...draft.categoryIds, c.id]
                        : draft.categoryIds.filter((id) => id !== c.id),
                    )
                  }
                />
                {c.parentName && <span className="text-stone-400">{c.parentName} ›</span>}
                {c.name}
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium">Attributes</h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Fabric</label>
              <input
                list="fabrics"
                value={draft.fabric}
                onChange={(e) => set("fabric", e.target.value)}
                className={field}
              />
              <datalist id="fabrics">
                {FABRICS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Work type</label>
              <input
                list="workTypes"
                value={draft.workType}
                onChange={(e) => set("workType", e.target.value)}
                className={field}
              />
              <datalist id="workTypes">
                {WORK_TYPES.map((w) => (
                  <option key={w} value={w} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Occasion</label>
              <input
                list="occasions"
                value={draft.occasion}
                onChange={(e) => set("occasion", e.target.value)}
                className={field}
              />
              <datalist id="occasions">
                {OCCASIONS.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Colour</label>
                <input
                  value={draft.color}
                  onChange={(e) => set("color", e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label className={labelCls}>Pattern</label>
                <input
                  value={draft.pattern}
                  onChange={(e) => set("pattern", e.target.value)}
                  className={field}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input
                value={draft.brand}
                onChange={(e) => set("brand", e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input
                value={draft.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="new-arrival, handloom"
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Care instructions</label>
              <textarea
                rows={3}
                value={draft.careInstructions}
                onChange={(e) => set("careInstructions", e.target.value)}
                className={field}
              />
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
