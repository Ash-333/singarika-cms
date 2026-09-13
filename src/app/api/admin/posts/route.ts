import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { handleError, ok, paginated, parsePagination } from "@/lib/api";
import { postCreateSchema } from "@/lib/validation";
import { createPost, postInclude } from "@/lib/services/posts";

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, perPage, skip, take } = parsePagination(sp);
    const q = sp.get("q")?.trim();
    const status = sp.get("status");

    const where: Prisma.BlogPostWhereInput = {
      ...(status ? { status: status as Prisma.EnumPostStatusFilter["equals"] } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: postInclude,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      prisma.blogPost.count({ where }),
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
    const input = postCreateSchema.parse(await req.json());
    return ok(await createPost(input, guard.user.id), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
