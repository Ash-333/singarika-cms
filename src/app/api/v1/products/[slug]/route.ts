import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/public-serialize";
import { corsPreflight, publicError, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/v1/products/:slug — full detail plus a few related products. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      images: { include: { media: true }, orderBy: { position: "asc" } },
      variants: { where: { isActive: true }, orderBy: { position: "asc" } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!product) return publicError("Product not found", 404);

  const categoryIds = product.categories.map((c) => c.categoryId);
  const related = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { not: product.id },
      ...(categoryIds.length ? { categories: { some: { categoryId: { in: categoryIds } } } } : {}),
    },
    include: {
      images: { include: { media: true }, orderBy: { position: "asc" }, take: 1 },
      variants: { where: { isActive: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
    take: 8,
    orderBy: { publishedAt: "desc" },
  });

  return publicJson({
    data: serializeProduct(product, { full: true }),
    related: related.map((p) => serializeProduct(p)),
  });
}

export const OPTIONS = corsPreflight;
