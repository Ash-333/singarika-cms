import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/product-form";
import { Badge, PageHeader } from "@/components/ui";
import { toProductDraft } from "@/lib/product-draft";
import { categoryOptions } from "@/lib/category-options";
import { productInclude } from "@/lib/services/products";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: productInclude }),
    categoryOptions(),
  ]);

  if (!product) notFound();

  return (
    <>
      <Link href="/products" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Products
      </Link>
      <PageHeader
        title={product.name}
        subtitle={`Last saved ${formatDate(product.updatedAt)} · /${product.slug}`}
        action={<Badge>{product.status}</Badge>}
      />
      <ProductForm initial={toProductDraft(product)} categories={categories} />
    </>
  );
}
