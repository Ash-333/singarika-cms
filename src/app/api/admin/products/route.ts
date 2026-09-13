import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { handleError, ok, paginated, parsePagination } from "@/lib/api";
import { productCreateSchema } from "@/lib/validation";
import { createProduct, productInclude } from "@/lib/services/products";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, perPage, skip, take } = parsePagination(sp);
    const q = sp.get("q")?.trim();
    const status = sp.get("status");
    const categoryId = sp.get("categoryId");

    const where: Prisma.ProductWhereInput = {
      ...(status ? { status: status as Prisma.EnumProductStatusFilter["equals"] } : {}),
      ...(categoryId ? { categories: { some: { categoryId } } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { fabric: { contains: q, mode: "insensitive" } },
              { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return paginated(items, { page, perPage, total });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const input = productCreateSchema.parse(await req.json());
    const product = await createProduct(input, guard.user.id);
    return ok(product, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
