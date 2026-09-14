import { cdnUrl } from "@/lib/cloudinary";
import { paisaToRupees } from "@/lib/money";

/**
 * Shapes DB rows into the contract the storefront consumes. Keeping this in one
 * place means the public JSON stays stable even if the schema moves around.
 */

type MediaRow = { publicId: string; secureUrl: string; width: number | null; height: number | null };

export function serializeImage(media: MediaRow, altText?: string | null) {
  return {
    url: media.secureUrl,
    alt: altText ?? "",
    width: media.width,
    height: media.height,
    thumb: cdnUrl(media.publicId, { width: 400, height: 600 }),
    card: cdnUrl(media.publicId, { width: 800, height: 1200 }),
    full: cdnUrl(media.publicId, { width: 1600 }),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeVariant(v: any, basePrice: number) {
  const price = v.price ?? basePrice;
  const available = Math.max(0, v.stock - v.reservedStock);
  return {
    id: v.id,
    sku: v.sku,
    size: v.size,
    color: v.color,
    option: v.optionLabel ? { label: v.optionLabel, value: v.optionValue } : null,
    price: paisaToRupees(price),
    weightGram: v.weightGram,
    inStock: available > 0 || v.allowBackorder,
    available,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeProduct(p: any, opts: { full?: boolean } = {}) {
  const images = (p.images ?? []).map((i: { media: MediaRow; altText: string | null }) =>
    serializeImage(i.media, i.altText ?? p.name),
  );
  const variants = (p.variants ?? [])
    .filter((v: { isActive: boolean }) => v.isActive)
    .map((v: unknown) => serializeVariant(v, p.basePrice));

  const prices = variants.map((v: { price: number }) => v.price);
  const base = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    price: paisaToRupees(p.basePrice),
    compareAtPrice: p.compareAtPrice == null ? null : paisaToRupees(p.compareAtPrice),
    priceRange: prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : { min: paisaToRupees(p.basePrice), max: paisaToRupees(p.basePrice) },
    currency: "NPR",
    isFeatured: p.isFeatured,
    inStock: variants.some((v: { inStock: boolean }) => v.inStock),
    fabric: p.fabric,
    workType: p.workType,
    occasion: p.occasion,
    color: p.color,
    pattern: p.pattern,
    brand: p.brand,
    image: images[0] ?? null,
    categories: (p.categories ?? []).map((c: { category: { name: string; slug: string } }) => ({
      name: c.category.name,
      slug: c.category.slug,
    })),
    tags: (p.tags ?? []).map((t: { tag: { name: string; slug: string } }) => t.tag),
    publishedAt: p.publishedAt,
  };

  if (!opts.full) return base;

  return {
    ...base,
    description: p.description,
    careInstructions: p.careInstructions,
    countryOfOrigin: p.countryOfOrigin,
    taxRatePct: p.taxRatePct,
    hsnCode: p.hsnCode,
    images,
    variants,
    seo: {
      title: p.metaTitle ?? p.name,
      description: p.metaDescription ?? p.shortDescription,
    },
    updatedAt: p.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializePost(p: any, opts: { full?: boolean } = {}) {
  const base = {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage ? serializeImage(p.coverImage, p.title) : null,
    author: p.author ? { name: p.author.name } : null,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    tags: (p.tags ?? []).map((t: { tag: { name: string; slug: string } }) => t.tag),
    readingMinutes: p.readingMinutes,
    publishedAt: p.publishedAt,
  };

  if (!opts.full) return base;

  return {
    ...base,
    content: p.content,
    seo: { title: p.metaTitle ?? p.title, description: p.metaDescription ?? p.excerpt },
    updatedAt: p.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeCategory(c: any) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image ? serializeImage(c.image, c.name) : null,
    productCount: c._count?.products ?? undefined,
    seo: { title: c.metaTitle ?? c.name, description: c.metaDescription },
    children: (c.children ?? []).map(serializeCategory),
  };
}
