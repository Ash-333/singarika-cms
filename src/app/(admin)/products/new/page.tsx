import ProductForm from "@/components/product-form";
import { PageHeader } from "@/components/ui";
import { blankProductDraft } from "@/lib/product-draft";
import { categoryOptions } from "@/lib/category-options";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await categoryOptions();

  return (
    <>
      <PageHeader title="New product" subtitle="Add an item to the catalogue" />
      <ProductForm initial={blankProductDraft()} categories={categories} />
    </>
  );
}
