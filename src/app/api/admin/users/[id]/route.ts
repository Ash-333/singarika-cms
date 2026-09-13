import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { fail, handleError, ok } from "@/lib/api";
import { userUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireUser("ADMIN");
  if ("response" in guard) return guard.response;

  try {
    const { id } = await params;
    const input = userUpdateSchema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 12) } : {}),
      },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireUser("ADMIN");
  if ("response" in guard) return guard.response;

  try {
    const { id } = await params;
    if (id === guard.user.id) return fail("You cannot delete your own account", 422);
    // Deactivating keeps authorship on posts and stock movements intact.
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return ok({ id, deactivated: true });
  } catch (error) {
    return handleError(error);
  }
}
