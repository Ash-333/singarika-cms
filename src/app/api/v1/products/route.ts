import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { rupeesToPaise } from "@/lib/money";
import { serializeProduct } from "@/lib/public-serialize";
import { corsPreflight, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { publishedAt: "desc" },
  oldest: { publishedAt: "asc" },
  "price-asc": { basePrice: "asc" },
  "price-desc": { basePrice: "desc" },
  name: { name: "asc" },
  featured: { isFeatured: "desc" },
};

/**
 * GET /api/v1/products
 * ?category=silk-sarees&fabric=Silk&occasion=Bridal&color=Red&tag=new
 * &minPrice=1000&maxPrice=9000&inStock=true&featured=true&q=kanjivaram
 * &sort=price-asc&page=1&perPage=24
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const perPage = Math.min(60, Math.max(1, Number(sp.get("perPage") ?? 24) || 24));

  const list = (key: string) =>
    sp.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);

  const categories = list("category");
  const fabrics = list("fabric");
  const occasions = list("occasion");
  const colors = list("color");
  const tags = list("tag");
  const q = sp.get("q")?.trim();
  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(categories.length
      ? {
          categories: {
            some: {
              category: {
                // Matching the parent slug also returns its children's products.
                OR: [{ slug: { in: categories } }, { parent: { slug: { in: categories } } }],
              },
            },
          },
        }
      : {}),
    ...(fabrics.length ? { fabric: { in: fabrics, mode: "insensitive" } } : {}),
    ...(occasions.length ? { occasion: { in: occasions, mode: "insensitive" } } : {}),
    ...(colors.length ? { color: { in: colors, mode: "insensitive" } } : {}),
    ...(tags.length ? { tags: { some: { tag: { slug: { in: tags } } } } } : {}),
    ...(sp.get("featured") === "true" ? { isFeatured: true } : {}),
    ...(sp.get("inStock") === "true"
      ? { variants: { some: { isActive: true, stock: { gt: 0 } } } }
      : {}),
    ...(minPrice || maxPrice
      ? {
          basePrice: {
            ...(minPrice ? { gte: rupeesToPaise(minPrice) } : {}),
            ...(maxPrice ? { lte: rupeesToPaise(maxPrice) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { shortDescription: { contains: q, mode: "insensitive" } },
            { fabric: { contains: q, mode: "insensitive" } },
            { workType: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { include: { media: true }, orderBy: { position: "asc" }, take: 2 },
        variants: { where: { isActive: true }, orderBy: { position: "asc" } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [SORTS[sp.get("sort") ?? "newest"] ?? SORTS.newest, { id: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return publicJson({
    data: rows.map((p) => serializeProduct(p)),
    meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  });
}

export const OPTIONS = corsPreflight;
