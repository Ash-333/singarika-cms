import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { fail, handleError, ok, paginated, parsePagination } from "@/lib/api";
import { stockAdjustSchema, stockSetSchema } from "@/lib/validation";
import { adjustStock, InsufficientStockError, setStock } from "@/lib/services/inventory";

/** Variant-level stock list, filterable by search text or low-stock only. */
export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, perPage, skip, take } = parsePagination(sp);
    const q = sp.get("q")?.trim();
    const lowOnly = sp.get("lowStock") === "true";

    const where = {
      ...(q
        ? {
            OR: [
              { sku: { contains: q, mode: "insensitive" as const } },
              { product: { name: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        include: { product: { select: { id: true, name: true, slug: true, status: true } } },
        orderBy: [{ stock: "asc" }, { sku: "asc" }],
        skip: lowOnly ? 0 : skip,
        take: lowOnly ? 500 : take,
      }),
      prisma.productVariant.count({ where }),
    ]);

    const items = lowOnly ? rows.filter((v) => v.stock <= v.lowStockAlert) : rows;
    return paginated(items, { page, perPage, total: lowOnly ? items.length : total });
  } catch (error) {
    return handleError(error);
  }
}

/** Signed adjustment (?mode=adjust, default) or absolute stock take (?mode=set). */
export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const mode = req.nextUrl.searchParams.get("mode") ?? "adjust";
    const body = await req.json();

    if (mode === "set") {
      const input = stockSetSchema.parse(body);
      return ok(await setStock({ ...input, userId: guard.user.id }));
    }

    const input = stockAdjustSchema.parse(body);
    return ok(await adjustStock({ ...input, userId: guard.user.id }));
  } catch (error) {
    if (error instanceof InsufficientStockError) return fail(error.message, 409);
    return handleError(error);
  }
}
