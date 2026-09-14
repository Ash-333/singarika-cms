import Link from "next/link";
import ProductForm from "@/components/product-form";
import { PageHeader } from "@/components/ui";
import { blankProductDraft } from "@/lib/product-draft";
import { categoryOptions } from "@/lib/category-options";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await categoryOptions();

  return (
    <>
      <Link href="/products" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Products
      </Link>
      <PageHeader
        title="New product"
        subtitle="Saved as a draft until you publish it."
      />
      <ProductForm initial={blankProductDraft()} categories={categories} />
    </>
  );
}
