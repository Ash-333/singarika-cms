import { prisma } from "@/lib/prisma";

/** Flat, parent-labelled category list for the product form's checkboxes. */
export async function categoryOptions() {
  const categories = await prisma.category.findMany({
    include: { parent: { select: { name: true } } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentName: c.parent?.name ?? null,
  }));
}
