import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import CategoryManager from "@/components/category-manager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      image: true,
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Two-level catalogue tree — e.g. Sarees › Kanjivaram"
      />
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          parentId: c.parentId,
          parentName: c.parent?.name ?? null,
          position: c.position,
          isActive: c.isActive,
          productCount: c._count.products,
          childCount: c._count.children,
          image: c.image
            ? {
                id: c.image.id,
                secureUrl: c.image.secureUrl,
                altText: c.image.altText,
                width: c.image.width,
                height: c.image.height,
              }
            : null,
        }))}
      />
    </>
  );
}
