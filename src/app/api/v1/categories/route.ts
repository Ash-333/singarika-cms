import { prisma } from "@/lib/prisma";
import { serializeCategory } from "@/lib/public-serialize";
import { corsPreflight, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

/** GET /api/v1/categories — active categories as a two-level tree. */
export async function GET() {
  const roots = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      image: true,
      _count: { select: { products: true } },
      children: {
        where: { isActive: true },
        include: { image: true, _count: { select: { products: true } } },
        orderBy: [{ position: "asc" }, { name: "asc" }],
      },
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  return publicJson({ data: roots.map(serializeCategory) }, 300, 900);
}

export const OPTIONS = corsPreflight;
