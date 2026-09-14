"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPicker, { type MediaItem } from "@/components/media-picker";
import {
  Button,
  Checkbox,
  Field,
  Input,
  MoneyInput,
  Notice,
  Section,
  Select,
  Textarea,
} from "@/components/ui";
import { PlusIcon } from "@/components/icons";

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

/** Nepali textile vocabulary — these become the storefront's filters. */
const FABRICS = [
  "Dhaka",
  "Pashmina",
  "Mul Cotton",
  "Cotton",
  "Silk",
  "Allo (nettle)",
  "Hemp",
  "Yak Wool",
  "Georgette",
  "Chiffon",
  "Velvet",
  "Linen",
];
const OCCASIONS = [
  "Dashain",
  "Tihar",
  "Teej",
  "Bihe (wedding)",
  "Bratabandha",
  "Pasni",
  "Festive",
  "Office",
  "Daily wear",
];
const WORK_TYPES = [
  "Dhaka weave",
  "Handloom",
  "Hand-block print",
  "Embroidery",
  "Mirror work",
  "Beadwork",
  "Tie-dye",
  "Applique",
  "Plain",
];

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

  // Margin is the number the shop actually watches; show it as soon as it exists.
  const price = Number(draft.basePrice || 0);
  const cost = Number(draft.costPrice || 0);
  const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null;

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
      taxRatePct: Number(draft.taxRatePct || 13),
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
      setError(json?.error?.message ?? "The product could not be saved.");
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
    >
      {/* One action bar, always in reach — no hunting for Save down the page. */}
      <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-3 border-b border-hairline bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <label htmlFor="product-status" className="text-sm text-muted">
          Status
        </label>
        <Select
          id="product-status"
          value={draft.status}
          onChange={(e) => set("status", e.target.value as ProductDraft["status"])}
          className="w-auto py-2"
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </Select>

        <div className="ml-auto flex gap-2">
          {draft.status !== "ACTIVE" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => save("ACTIVE")}
            >
              Publish now
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : draft.id ? "Save changes" : "Create product"}
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
          <Section title="Basics" description="What the customer reads first.">
            <div className="space-y-4">
              <Field label="Product name" required>
                {(id) => (
                  <Input
                    id={id}
                    required
                    value={draft.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Dhaka kurtha suruwal with patuka"
                  />
                )}
              </Field>
              <Field
                label="Web address"
                hint={
                  draft.slug
                    ? `singarika.com/products/${draft.slug}`
                    : "Left blank, this is built from the product name."
                }
              >
                {(id) => (
                  <Input
                    id={id}
                    value={draft.slug}
                    onChange={(e) => set("slug", e.target.value)}
                    placeholder="dhaka-kurtha-suruwal"
                  />
                )}
              </Field>
              <Field label="Short description" hint="One line, shown under the name on listings.">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.shortDescription}
                    onChange={(e) => set("shortDescription", e.target.value)}
                    placeholder="Handwoven Dhaka cotton, stitched in Kathmandu."
                  />
                )}
              </Field>
              <Field label="Full description">
                {(id) => (
                  <Textarea
                    id={id}
                    rows={6}
                    value={draft.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Fabric, weave, fit, what it comes with…"
                  />
                )}
              </Field>
            </div>
          </Section>

          <Section title="Photos" description="The first photo is the one shoppers see on listings.">
            <MediaPicker
              selected={draft.images}
              onChange={(images) => set("images", images)}
              folder="products"
            />
          </Section>

          <Section
            title="Sizes & stock"
            description="One row per size or colour you sell separately."
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => set("variants", [...draft.variants, emptyVariant()])}
              >
                <PlusIcon className="size-4" />
                Add a size
              </Button>
            }
          >
            {draft.id && (
              <Notice tone="info" className="mb-4">
                Stock counts are changed on the Stock page, so every movement is recorded in the
                ledger.
              </Notice>
            )}

            <div className="space-y-3">
              {draft.variants.map((v, i) => (
                <div key={v.id ?? i} className="rounded-lg border border-hairline bg-sunk p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">
                      {[v.size, v.color].filter(Boolean).join(" · ") || `Size ${i + 1}`}
                    </p>
                    {draft.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => set("variants", draft.variants.filter((_, idx) => idx !== i))}
                        className="text-sm text-danger hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="SKU" hint="Your own stock code.">
                      {(id) => (
                        <Input
                          id={id}
                          required
                          value={v.sku}
                          onChange={(e) => setVariant(i, { sku: e.target.value })}
                          placeholder="DHK-KUR-RED-M"
                        />
                      )}
                    </Field>
                    <Field label="Size">
                      {(id) => (
                        <Input
                          id={id}
                          value={v.size}
                          onChange={(e) => setVariant(i, { size: e.target.value })}
                          placeholder="Free size / M"
                        />
                      )}
                    </Field>
                    <Field label="Colour">
                      {(id) => (
                        <Input
                          id={id}
                          value={v.color}
                          onChange={(e) => setVariant(i, { color: e.target.value })}
                          placeholder="Rato"
                        />
                      )}
                    </Field>
                    <Field label="Price" hint="Leave empty to use the product price.">
                      {(id) => (
                        <MoneyInput
                          id={id}
                          value={v.price}
                          onChange={(e) => setVariant(i, { price: e.target.value })}
                          placeholder="Same as product"
                        />
                      )}
                    </Field>
                    <Field label={v.id ? "In stock (set on Stock page)" : "Opening stock"}>
                      {(id) => (
                        <Input
                          id={id}
                          type="number"
                          min="0"
                          value={v.stock}
                          disabled={Boolean(v.id)}
                          onChange={(e) => setVariant(i, { stock: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Warn me below">
                      {(id) => (
                        <Input
                          id={id}
                          type="number"
                          min="0"
                          value={v.lowStockAlert}
                          onChange={(e) => setVariant(i, { lowStockAlert: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Weight (g)" hint="Used for delivery charges.">
                      {(id) => (
                        <Input
                          id={id}
                          type="number"
                          min="0"
                          value={v.weightGram}
                          onChange={(e) => setVariant(i, { weightGram: e.target.value })}
                        />
                      )}
                    </Field>
                    <div className="flex items-end pb-1">
                      <Checkbox
                        label="Sell this size"
                        checked={v.isActive}
                        onChange={(e) => setVariant(i, { isActive: e.target.checked })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Google listing"
            description="How this product appears in search results. Left empty, the name and short description are used."
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
              <Field label="Page description" hint="Around 155 characters reads best.">
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
          <Section
            title="Pricing"
            description={margin === null ? "Prices are in Nepali rupees." : `Margin ${margin}%`}
          >
            <div className="space-y-4">
              <Field label="Selling price" required>
                {(id) => (
                  <MoneyInput
                    id={id}
                    required
                    value={draft.basePrice}
                    onChange={(e) => set("basePrice", e.target.value)}
                  />
                )}
              </Field>
              <Field label="Was price" hint="Shown struck through next to the selling price.">
                {(id) => (
                  <MoneyInput
                    id={id}
                    value={draft.compareAtPrice}
                    onChange={(e) => set("compareAtPrice", e.target.value)}
                  />
                )}
              </Field>
              <Field label="What it cost you" hint="Never shown to customers.">
                {(id) => (
                  <MoneyInput
                    id={id}
                    value={draft.costPrice}
                    onChange={(e) => set("costPrice", e.target.value)}
                  />
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="VAT %">
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min="0"
                      max="100"
                      value={draft.taxRatePct}
                      onChange={(e) => set("taxRatePct", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="HS code" hint="For customs.">
                  {(id) => (
                    <Input
                      id={id}
                      value={draft.hsnCode}
                      onChange={(e) => set("hsnCode", e.target.value)}
                    />
                  )}
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Categories" description="Where this sits in the shop menu.">
            {categories.length === 0 ? (
              <p className="text-sm text-muted">
                No categories yet — create them on the Categories page.
              </p>
            ) : (
              <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
                {categories.map((c) => (
                  <Checkbox
                    key={c.id}
                    label={c.parentName ? `${c.parentName} › ${c.name}` : c.name}
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
                ))}
              </div>
            )}
            <div className="mt-4 border-t border-hairline pt-4">
              <Checkbox
                label="Feature on the homepage"
                checked={draft.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
              />
            </div>
          </Section>

          <Section title="Details" description="These become filters on the storefront.">
            <div className="space-y-4">
              <Field label="Fabric">
                {(id) => (
                  <>
                    <Input
                      id={id}
                      list="fabrics"
                      value={draft.fabric}
                      onChange={(e) => set("fabric", e.target.value)}
                      placeholder="Dhaka"
                    />
                    <datalist id="fabrics">
                      {FABRICS.map((f) => (
                        <option key={f} value={f} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>
              <Field label="Weave or work">
                {(id) => (
                  <>
                    <Input
                      id={id}
                      list="workTypes"
                      value={draft.workType}
                      onChange={(e) => set("workType", e.target.value)}
                      placeholder="Dhaka weave"
                    />
                    <datalist id="workTypes">
                      {WORK_TYPES.map((w) => (
                        <option key={w} value={w} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>
              <Field label="Worn for">
                {(id) => (
                  <>
                    <Input
                      id={id}
                      list="occasions"
                      value={draft.occasion}
                      onChange={(e) => set("occasion", e.target.value)}
                      placeholder="Dashain"
                    />
                    <datalist id="occasions">
                      {OCCASIONS.map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Colour">
                  {(id) => (
                    <Input
                      id={id}
                      value={draft.color}
                      onChange={(e) => set("color", e.target.value)}
                    />
                  )}
                </Field>
                <Field label="Pattern">
                  {(id) => (
                    <Input
                      id={id}
                      value={draft.pattern}
                      onChange={(e) => set("pattern", e.target.value)}
                    />
                  )}
                </Field>
              </div>
              <Field label="Brand or weaver">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.brand}
                    onChange={(e) => set("brand", e.target.value)}
                    placeholder="Singarika"
                  />
                )}
              </Field>
              <Field label="Tags" hint="Separate with commas.">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="new-arrival, handloom"
                  />
                )}
              </Field>
              <Field label="Care instructions">
                {(id) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={draft.careInstructions}
                    onChange={(e) => set("careInstructions", e.target.value)}
                    placeholder="Hand wash cold. Dry in shade."
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
