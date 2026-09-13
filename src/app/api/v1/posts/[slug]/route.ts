import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/public-serialize";
import { corsPreflight, publicError, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: {
      coverImage: true,
      category: true,
      author: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!post) return publicError("Post not found", 404);

  const related = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      id: { not: post.id },
      ...(post.categoryId ? { categoryId: post.categoryId } : {}),
    },
    include: {
      coverImage: true,
      category: true,
      author: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
  });

  return publicJson({
    data: serializePost(post, { full: true }),
    related: related.map((p) => serializePost(p)),
  });
}

export const OPTIONS = corsPreflight;
