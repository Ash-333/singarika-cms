import { prisma } from "@/lib/prisma";
import type { StockMovementReason } from "@/generated/prisma/client";

export class InsufficientStockError extends Error {
  constructor(public sku: string, public available: number) {
    super(`Not enough stock for ${sku} (available: ${available})`);
  }
}

/**
 * Applies a signed stock delta and writes a ledger row in one transaction.
 * Negative deltas are rejected when they would take stock below zero, unless
 * the variant allows backorders.
 */
export async function adjustStock(params: {
  variantId: string;
  quantity: number;
  reason: StockMovementReason;
  note?: string | null;
  reference?: string | null;
  userId?: string | null;
}) {
  const { variantId, quantity, reason, note, reference, userId } = params;

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUniqueOrThrow({
      where: { id: variantId },
      select: { id: true, sku: true, stock: true, allowBackorder: true },
    });

    const next = variant.stock + quantity;
    if (next < 0 && !variant.allowBackorder) {
      throw new InsufficientStockError(variant.sku, variant.stock);
    }

    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: next },
    });

    const movement = await tx.stockMovement.create({
      data: {
        variantId,
        quantity,
        reason,
        stockAfter: next,
        note: note ?? null,
        reference: reference ?? null,
        userId: userId ?? null,
      },
    });

    return { variant: updated, movement };
  });
}

/** Sets an absolute stock count (stock take) and records the difference. */
export async function setStock(params: {
  variantId: string;
  stock: number;
  note?: string | null;
  userId?: string | null;
}) {
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: params.variantId },
    select: { stock: true },
  });
  const delta = params.stock - variant.stock;
  if (delta === 0) {
    return { variant: await prisma.productVariant.findUniqueOrThrow({ where: { id: params.variantId } }), movement: null };
  }
  return adjustStock({
    variantId: params.variantId,
    quantity: delta,
    reason: "ADJUSTMENT",
    note: params.note ?? "Stock take",
    userId: params.userId,
  });
}

/** Variants at or below their low-stock threshold, worst first. */
export async function lowStockVariants(limit = 50) {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      sku: string;
      size: string | null;
      color: string | null;
      stock: number;
      lowStockAlert: number;
      productName: string;
      productSlug: string;
    }>
  >`
    SELECT v.id, v.sku, v.size, v.color, v.stock, v."lowStockAlert",
           p.name AS "productName", p.slug AS "productSlug"
    FROM product_variants v
    JOIN products p ON p.id = v."productId"
    WHERE v."isActive" = true AND v.stock <= v."lowStockAlert"
    ORDER BY v.stock ASC
    LIMIT ${limit}
  `;
  return rows;
}
