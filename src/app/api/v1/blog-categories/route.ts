import { prisma } from "@/lib/prisma";
import { corsPreflight, publicJson } from "@/lib/public-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.blogCategory.findMany({
    where: { posts: { some: { status: "PUBLISHED" } } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: { name: "asc" },
  });

  return publicJson(
    { data: categories.map((c) => ({ ...c, postCount: c._count.posts, _count: undefined })) },
    300,
    900,
  );
}

export const OPTIONS = corsPreflight;
