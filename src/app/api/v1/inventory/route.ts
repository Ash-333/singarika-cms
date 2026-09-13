import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, publicError, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/inventory  { "skus": ["SAR-001-FS"] }
 * Live availability check — call this before checkout, never trust cached
 * stock from the product endpoints.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const skus: string[] = Array.isArray(body?.skus) ? body.skus.slice(0, 100) : [];
  if (skus.length === 0) return publicError("Provide a non-empty `skus` array", 422);

  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: skus }, isActive: true },
    select: { sku: true, stock: true, reservedStock: true, allowBackorder: true },
  });

  const bySku = Object.fromEntries(
    variants.map((v) => {
      const available = Math.max(0, v.stock - v.reservedStock);
      return [v.sku, { available, inStock: available > 0 || v.allowBackorder }];
    }),
  );

  return publicJson({
    data: skus.map((sku) => ({ sku, ...(bySku[sku] ?? { available: 0, inStock: false }) })),
  }, 0, 0);
}

export const OPTIONS = corsPreflight;
