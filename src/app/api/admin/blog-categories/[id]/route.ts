import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { handleError, ok } from "@/lib/api";
import { blogCategorySchema } from "@/lib/validation";
import { uniqueSlug } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const { id } = await params;
    const input = blogCategorySchema.partial().parse(await req.json());
    const slug =
      input.slug || input.name
        ? await uniqueSlug("blogCategory", input.slug || input.name!, id)
        : undefined;
    return ok(
      await prisma.blogCategory.update({
        where: { id },
        data: { ...input, ...(slug ? { slug } : {}) },
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const { id } = await params;
    await prisma.blogCategory.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
