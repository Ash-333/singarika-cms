import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { handleError, ok } from "@/lib/api";
import { lowStockVariants } from "@/lib/services/inventory";

export async function GET() {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const [products, activeProducts, categories, posts, publishedPosts, media, lowStock, stockSum] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.category.count(),
        prisma.blogPost.count(),
        prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
        prisma.media.count(),
        lowStockVariants(10),
        prisma.productVariant.aggregate({ _sum: { stock: true } }),
      ]);

    return ok({
      products,
      activeProducts,
      categories,
      posts,
      publishedPosts,
      media,
      unitsInStock: stockSum._sum.stock ?? 0,
      lowStockCount: lowStock.length,
      lowStock,
    });
  } catch (error) {
    return handleError(error);
  }
}
