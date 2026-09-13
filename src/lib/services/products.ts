import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { rupeesToPaise } from "@/lib/money";
import { upsertTags } from "@/lib/services/tags";
import { productCreateSchema, productUpdateSchema } from "@/lib/validation";

type CreateInput = z.infer<typeof productCreateSchema>;
type UpdateInput = z.infer<typeof productUpdateSchema>;

export const productInclude = {
  images: { include: { media: true }, orderBy: { position: "asc" } },
  variants: { orderBy: { position: "asc" } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.ProductInclude;

function scalarFields(input: Partial<CreateInput>) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.shortDescription !== undefined && { shortDescription: input.shortDescription }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
    ...(input.basePrice !== undefined && { basePrice: rupeesToPaise(input.basePrice) }),
    ...(input.compareAtPrice !== undefined && {
      compareAtPrice: input.compareAtPrice == null ? null : rupeesToPaise(input.compareAtPrice),
    }),
    ...(input.costPrice !== undefined && {
      costPrice: input.costPrice == null ? null : rupeesToPaise(input.costPrice),
    }),
    ...(input.fabric !== undefined && { fabric: input.fabric }),
    ...(input.workType !== undefined && { workType: input.workType }),
    ...(input.occasion !== undefined && { occasion: input.occasion }),
    ...(input.color !== undefined && { color: input.color }),
    ...(input.pattern !== undefined && { pattern: input.pattern }),
    ...(input.careInstructions !== undefined && { careInstructions: input.careInstructions }),
    ...(input.countryOfOrigin !== undefined && { countryOfOrigin: input.countryOfOrigin }),
    ...(input.brand !== undefined && { brand: input.brand }),
    ...(input.hsnCode !== undefined && { hsnCode: input.hsnCode }),
    ...(input.taxRatePct !== undefined && { taxRatePct: input.taxRatePct }),
    ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
    ...(input.metaDescription !== undefined && { metaDescription: input.metaDescription }),
  };
}

export async function createProduct(input: CreateInput, userId: string) {
  const slug = await uniqueSlug("product", input.slug || input.name);
  const tagIds = await upsertTags(input.tagNames);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        ...scalarFields(input),
        name: input.name,
        basePrice: rupeesToPaise(input.basePrice),
        slug,
        publishedAt: input.status === "ACTIVE" ? new Date() : null,
        categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        images: {
          create: input.images.map((img, i) => ({
            mediaId: img.mediaId,
            altText: img.altText,
            position: img.position ?? i,
          })),
        },
        variants: {
          create: input.variants.map((v, i) => ({
            sku: v.sku,
            size: v.size,
            color: v.color,
            optionLabel: v.optionLabel,
            optionValue: v.optionValue,
            price: v.price == null ? null : rupeesToPaise(v.price),
            weightGram: v.weightGram,
            stock: v.stock,
            lowStockAlert: v.lowStockAlert,
            allowBackorder: v.allowBackorder,
            position: v.position ?? i,
            isActive: v.isActive,
          })),
        },
      },
      include: productInclude,
    });

    // Opening stock is recorded so the ledger always explains current stock.
    await tx.stockMovement.createMany({
      data: product.variants
        .filter((v) => v.stock > 0)
        .map((v) => ({
          variantId: v.id,
          reason: "PURCHASE" as const,
          quantity: v.stock,
          stockAfter: v.stock,
          note: "Opening stock",
          userId,
        })),
    });

    return product;
  });
}

export async function updateProduct(id: string, input: UpdateInput) {
  const current = await prisma.product.findUniqueOrThrow({
    where: { id },
    select: { slug: true, status: true, publishedAt: true },
  });

  const slug =
    input.slug || input.name
      ? await uniqueSlug("product", input.slug || input.name!, id)
      : current.slug;

  const goingLive = input.status === "ACTIVE" && current.status !== "ACTIVE";

  return prisma.$transaction(async (tx) => {
    if (input.categoryIds) {
      await tx.productCategory.deleteMany({ where: { productId: id } });
      await tx.productCategory.createMany({
        data: input.categoryIds.map((categoryId) => ({ productId: id, categoryId })),
      });
    }

    if (input.tagNames) {
      const tagIds = await upsertTags(input.tagNames);
      await tx.tagOnProduct.deleteMany({ where: { productId: id } });
      await tx.tagOnProduct.createMany({
        data: tagIds.map((tagId) => ({ productId: id, tagId })),
      });
    }

    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: input.images.map((img, i) => ({
          productId: id,
          mediaId: img.mediaId,
          altText: img.altText,
          position: img.position ?? i,
        })),
      });
    }

    if (input.variants) {
      const keepIds = input.variants.map((v) => v.id).filter(Boolean) as string[];
      // Variants dropped in the editor are removed along with their ledger.
      await tx.productVariant.deleteMany({
        where: { productId: id, id: { notIn: keepIds.length ? keepIds : ["__none__"] } },
      });

      for (const [i, v] of input.variants.entries()) {
        const data = {
          sku: v.sku,
          size: v.size,
          color: v.color,
          optionLabel: v.optionLabel,
          optionValue: v.optionValue,
          price: v.price == null ? null : rupeesToPaise(v.price),
          weightGram: v.weightGram,
          lowStockAlert: v.lowStockAlert,
          allowBackorder: v.allowBackorder,
          position: v.position ?? i,
          isActive: v.isActive,
        };
        if (v.id) {
          // Stock is deliberately NOT updated here — it moves only through the
          // inventory endpoints so every change lands in the ledger.
          await tx.productVariant.update({ where: { id: v.id }, data });
        } else {
          const created = await tx.productVariant.create({
            data: { ...data, productId: id, stock: v.stock },
          });
          if (v.stock > 0) {
            await tx.stockMovement.create({
              data: {
                variantId: created.id,
                reason: "PURCHASE",
                quantity: v.stock,
                stockAfter: v.stock,
                note: "Opening stock",
              },
            });
          }
        }
      }
    }

    return tx.product.update({
      where: { id },
      data: {
        ...scalarFields(input),
        slug,
        ...(goingLive && !current.publishedAt ? { publishedAt: new Date() } : {}),
      },
      include: productInclude,
    });
  });
}
