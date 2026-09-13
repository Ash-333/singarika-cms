import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/public-serialize";
import { corsPreflight, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

/** GET /api/v1/posts?category=styling&tag=saree&q=drape&page=1&perPage=12 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const perPage = Math.min(50, Math.max(1, Number(sp.get("perPage") ?? 12) || 12));
  const q = sp.get("q")?.trim();

  const where: Prisma.BlogPostWhereInput = {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    ...(sp.get("category") ? { category: { slug: sp.get("category")! } } : {}),
    ...(sp.get("tag") ? { tags: { some: { tag: { slug: sp.get("tag")! } } } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        coverImage: true,
        category: true,
        author: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return publicJson({
    data: rows.map((p) => serializePost(p)),
    meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  });
}

export const OPTIONS = corsPreflight;
