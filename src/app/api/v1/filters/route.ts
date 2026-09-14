import { prisma } from "@/lib/prisma";
import { paisaToRupees } from "@/lib/money";
import { corsPreflight, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/filters — facet values with counts, for storefront filter rails.
 */
export async function GET() {
  const where = { status: "ACTIVE" as const };

  const [fabrics, occasions, colors, workTypes, price, tags] = await Promise.all([
    prisma.product.groupBy({ by: ["fabric"], where, _count: true }),
    prisma.product.groupBy({ by: ["occasion"], where, _count: true }),
    prisma.product.groupBy({ by: ["color"], where, _count: true }),
    prisma.product.groupBy({ by: ["workType"], where, _count: true }),
    prisma.product.aggregate({ where, _min: { basePrice: true }, _max: { basePrice: true } }),
    prisma.tag.findMany({
      where: { products: { some: { product: where } } },
      select: { name: true, slug: true, _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const facet = (rows: Array<Record<string, unknown> & { _count: number }>, key: string) =>
    rows
      .filter((r) => r[key])
      .map((r) => ({ value: r[key] as string, count: r._count }))
      .sort((a, b) => b.count - a.count);

  return publicJson(
    {
      data: {
        fabric: facet(fabrics, "fabric"),
        occasion: facet(occasions, "occasion"),
        color: facet(colors, "color"),
        workType: facet(workTypes, "workType"),
        tags: tags.map((t) => ({ value: t.slug, label: t.name, count: t._count.products })),
        price: {
          min: paisaToRupees(price._min.basePrice ?? 0),
          max: paisaToRupees(price._max.basePrice ?? 0),
        },
      },
    },
    300,
    900,
  );
}

export const OPTIONS = corsPreflight;
