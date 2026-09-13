import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { fail, handleError, ok } from "@/lib/api";
import { productUpdateSchema } from "@/lib/validation";
import { productInclude, updateProduct } from "@/lib/services/products";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) return fail("Product not found", 404);
    return ok(product);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const { id } = await params;
    const input = productUpdateSchema.parse(await req.json());
    return ok(await updateProduct(id, input));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return ok({ id, deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
