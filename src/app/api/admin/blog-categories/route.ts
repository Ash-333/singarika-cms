import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { handleError, ok } from "@/lib/api";
import { blogCategorySchema } from "@/lib/validation";
import { uniqueSlug } from "@/lib/slug";

export async function GET() {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    return ok(
      await prisma.blogCategory.findMany({
        include: { _count: { select: { posts: true } } },
        orderBy: { name: "asc" },
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const input = blogCategorySchema.parse(await req.json());
    const slug = await uniqueSlug("blogCategory", input.slug || input.name);
    return ok(await prisma.blogCategory.create({ data: { ...input, slug } }), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
