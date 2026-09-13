import { z } from "zod";

const optionalString = z.string().trim().max(5000).optional().nullable();
const shortString = z.string().trim().max(255).optional().nullable();

/**
 * Builds the PATCH counterpart of a create schema.
 *
 * `.partial()` alone is not enough: a field declared with `.default(...)` still
 * produces its default when the key is absent, so a PATCH of `{ status }` would
 * silently reset tags, images and categories. Unwrapping the defaults first
 * means an omitted key stays `undefined` and the service layer leaves it alone.
 */
type Unwrapped<T> = T extends z.ZodDefault<infer Inner> ? Inner : T;
type UpdateShape<T extends z.ZodRawShape> = {
  [K in keyof T]: z.ZodOptional<Unwrapped<T[K]>>;
};

function toUpdateSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
): z.ZodObject<UpdateShape<T>> {
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      const field = value as z.ZodTypeAny;
      const inner =
        field.def.type === "default"
          ? (field.def as unknown as { innerType: z.ZodTypeAny }).innerType
          : field;
      return [key, inner.optional()];
    }),
  ) as unknown as UpdateShape<T>;

  return z.object(shape);
}

// ------------------------------------------------------------------ Category

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().max(180).optional(),
  description: optionalString,
  parentId: z.string().cuid().optional().nullable(),
  imageId: z.string().cuid().optional().nullable(),
  position: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metaTitle: shortString,
  metaDescription: optionalString,
});

export const categoryUpdateSchema = toUpdateSchema(categoryCreateSchema);

// ------------------------------------------------------------------- Product

export const variantSchema = z.object({
  id: z.string().cuid().optional(),
  sku: z.string().trim().min(1).max(64),
  size: shortString,
  color: shortString,
  optionLabel: shortString,
  optionValue: shortString,
  // Prices arrive in rupees from the UI and are converted to paise in the route.
  price: z.coerce.number().min(0).optional().nullable(),
  weightGram: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockAlert: z.coerce.number().int().min(0).default(3),
  allowBackorder: z.boolean().default(false),
  position: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(220).optional(),
  description: optionalString,
  shortDescription: shortString,
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),

  basePrice: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  costPrice: z.coerce.number().min(0).optional().nullable(),

  fabric: shortString,
  workType: shortString,
  occasion: shortString,
  color: shortString,
  pattern: shortString,
  careInstructions: optionalString,
  countryOfOrigin: shortString,
  brand: shortString,
  hsnCode: shortString,
  taxRatePct: z.coerce.number().int().min(0).max(100).default(5),

  metaTitle: shortString,
  metaDescription: optionalString,

  categoryIds: z.array(z.string().cuid()).default([]),
  tagNames: z.array(z.string().trim().min(1)).default([]),
  images: z
    .array(
      z.object({
        mediaId: z.string().cuid(),
        altText: shortString,
        position: z.coerce.number().int().min(0).default(0),
      }),
    )
    .default([]),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

export const productUpdateSchema = toUpdateSchema(productCreateSchema);

// ----------------------------------------------------------------- Inventory

export const stockAdjustSchema = z.object({
  variantId: z.string().cuid(),
  // Signed delta, e.g. +12 received or -1 damaged.
  quantity: z.coerce.number().int().refine((n) => n !== 0, "Quantity cannot be zero"),
  reason: z.enum([
    "PURCHASE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "DAMAGE",
    "RESERVATION",
    "RELEASE",
  ]),
  note: shortString,
  reference: shortString,
});

export const stockSetSchema = z.object({
  variantId: z.string().cuid(),
  stock: z.coerce.number().int().min(0),
  note: shortString,
});

// ---------------------------------------------------------------------- Blog

export const postCreateSchema = z.object({
  title: z.string().trim().min(1).max(220),
  slug: z.string().trim().max(240).optional(),
  excerpt: shortString,
  content: z.string().default(""),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  coverImageId: z.string().cuid().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  tagNames: z.array(z.string().trim().min(1)).default([]),
  metaTitle: shortString,
  metaDescription: optionalString,
  publishedAt: z.coerce.date().optional().nullable(),
});

export const postUpdateSchema = toUpdateSchema(postCreateSchema);

export const blogCategorySchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().max(180).optional(),
  description: optionalString,
});

// --------------------------------------------------------------------- Users

export const userCreateSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(160),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "EDITOR"]).default("EDITOR"),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "EDITOR"]).optional(),
  isActive: z.boolean().optional(),
});
