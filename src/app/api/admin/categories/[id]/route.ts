import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { fail, handleError, ok } from "@/lib/api";
import { categoryUpdateSchema } from "@/lib/validation";
import { uniqueSlug } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: { image: true, children: true },
    });
    if (!category) return fail("Category not found", 404);
    return ok(category);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const { id } = await params;
    const input = categoryUpdateSchema.parse(await req.json());

    if (input.parentId === id) return fail("A category cannot be its own parent", 422);

    const slug =
      input.slug || input.name
        ? await uniqueSlug("category", input.slug || input.name!, id)
        : undefined;

    const category = await prisma.category.update({
      where: { id },
      data: { ...input, ...(slug ? { slug } : {}) },
    });
    return ok(category);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const { id } = await params;
    // Children are re-parented by the schema's SetNull rule; product links cascade.
    await prisma.category.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
