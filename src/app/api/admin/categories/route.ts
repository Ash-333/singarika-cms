import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { handleError, ok } from "@/lib/api";
import { categoryCreateSchema } from "@/lib/validation";
import { uniqueSlug } from "@/lib/slug";

export async function GET() {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const categories = await prisma.category.findMany({
      include: { image: true, _count: { select: { products: true, children: true } } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    return ok(categories);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const input = categoryCreateSchema.parse(await req.json());
    const slug = await uniqueSlug("category", input.slug || input.name);
    const category = await prisma.category.create({ data: { ...input, slug } });
    return ok(category, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
