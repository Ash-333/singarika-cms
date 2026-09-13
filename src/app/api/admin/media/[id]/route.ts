import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { fail, handleError, ok } from "@/lib/api";
import { destroyAsset } from "@/lib/cloudinary";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const { id } = await params;
    const { altText } = await req.json();
    return ok(await prisma.media.update({ where: { id }, data: { altText } }));
  } catch (error) {
    return handleError(error);
  }
}

/** Removes the asset from Cloudinary first, then the DB row. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const { id } = await params;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return fail("Media not found", 404);

    await destroyAsset(media.publicId);
    await prisma.media.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
