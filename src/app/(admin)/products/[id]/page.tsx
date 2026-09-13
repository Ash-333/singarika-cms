import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/product-form";
import { PageHeader } from "@/components/ui";
import { toProductDraft } from "@/lib/product-draft";
import { categoryOptions } from "@/lib/category-options";
import { productInclude } from "@/lib/services/products";

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
      <PageHeader title={product.name} subtitle={`/${product.slug}`} />
      <ProductForm initial={toProductDraft(product)} categories={categories} />
    </>
  );
}
