import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { fail, handleError, ok } from "@/lib/api";
import { postUpdateSchema } from "@/lib/validation";
import { postInclude, updatePost } from "@/lib/services/posts";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id }, include: postInclude });
    if (!post) return fail("Post not found", 404);
    return ok(post);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const { id } = await params;
    const input = postUpdateSchema.parse(await req.json());
    return ok(await updatePost(id, input));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
