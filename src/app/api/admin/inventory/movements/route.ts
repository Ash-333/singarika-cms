import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { handleError, paginated, parsePagination } from "@/lib/api";

/** Stock ledger, newest first. Filter with ?variantId= or ?productId=. */
export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, perPage, skip, take } = parsePagination(sp);
    const variantId = sp.get("variantId");
    const productId = sp.get("productId");

    const where = {
      ...(variantId ? { variantId } : {}),
      ...(productId ? { variant: { productId } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          variant: { select: { sku: true, product: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return paginated(items, { page, perPage, total });
  } catch (error) {
    return handleError(error);
  }
}
