import type { ProductDraft } from "@/components/product-form";
import { paiseToRupees } from "@/lib/money";

const str = (v: unknown) => (v == null ? "" : String(v));
const rupees = (v: number | null | undefined) => (v == null ? "" : String(paiseToRupees(v)));

export function blankProductDraft(): ProductDraft {
  return {
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    status: "DRAFT",
    isFeatured: false,
    basePrice: "",
    compareAtPrice: "",
    costPrice: "",
    fabric: "",
    workType: "",
    occasion: "",
    color: "",
    pattern: "",
    careInstructions: "",
    brand: "",
    hsnCode: "",
    taxRatePct: "5",
    metaTitle: "",
    metaDescription: "",
    categoryIds: [],
    tags: "",
    images: [],
    variants: [
      {
        sku: "",
        size: "Free Size",
        color: "",
        optionLabel: "",
        optionValue: "",
        price: "",
        weightGram: "",
        stock: "0",
        lowStockAlert: "3",
        allowBackorder: false,
        isActive: true,
      },
    ],
  };
}

/** Maps a Prisma product row (with relations) onto the form's string-based draft. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProductDraft(p: any): ProductDraft {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: str(p.shortDescription),
    description: str(p.description),
    status: p.status,
    isFeatured: p.isFeatured,
    basePrice: String(paiseToRupees(p.basePrice)),
    compareAtPrice: rupees(p.compareAtPrice),
    costPrice: rupees(p.costPrice),
    fabric: str(p.fabric),
    workType: str(p.workType),
    occasion: str(p.occasion),
    color: str(p.color),
    pattern: str(p.pattern),
    careInstructions: str(p.careInstructions),
    brand: str(p.brand),
    hsnCode: str(p.hsnCode),
    taxRatePct: String(p.taxRatePct),
    metaTitle: str(p.metaTitle),
    metaDescription: str(p.metaDescription),
    categoryIds: p.categories.map((c: { categoryId: string }) => c.categoryId),
    tags: p.tags.map((t: { tag: { name: string } }) => t.tag.name).join(", "),
    images: p.images.map((img: { media: { id: string; secureUrl: string; width: number | null; height: number | null }; altText: string | null }) => ({
      id: img.media.id,
      secureUrl: img.media.secureUrl,
      altText: img.altText,
      width: img.media.width,
      height: img.media.height,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variants: p.variants.map((v: any) => ({
      id: v.id,
      sku: v.sku,
      size: str(v.size),
      color: str(v.color),
      optionLabel: str(v.optionLabel),
      optionValue: str(v.optionValue),
      price: rupees(v.price),
      weightGram: v.weightGram == null ? "" : String(v.weightGram),
      stock: String(v.stock),
      lowStockAlert: String(v.lowStockAlert),
      allowBackorder: v.allowBackorder,
      isActive: v.isActive,
    })),
  };
}
