import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCategory } from "@/lib/public-serialize";
import { corsPreflight, publicError, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    include: {
      image: true,
      parent: true,
      _count: { select: { products: true } },
      children: {
        where: { isActive: true },
        include: { image: true, _count: { select: { products: true } } },
        orderBy: [{ position: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!category) return publicError("Category not found", 404);

  return publicJson({
    data: {
      ...serializeCategory(category),
      // Breadcrumb trail for the storefront header.
      breadcrumb: [
        ...(category.parent ? [{ name: category.parent.name, slug: category.parent.slug }] : []),
        { name: category.name, slug: category.slug },
      ],
    },
  }, 300, 900);
}

export const OPTIONS = corsPreflight;
