import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import SearchBar from "@/components/search-bar";
import InventoryTable from "@/components/inventory-table";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lowStock?: string }>;
}) {
  const sp = await searchParams;

  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      ...(sp.q
        ? {
            OR: [
              { sku: { contains: sp.q, mode: "insensitive" as const } },
              { product: { name: { contains: sp.q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: { product: { select: { id: true, name: true } } },
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
    take: 200,
  });

  const rows = (sp.lowStock === "true"
    ? variants.filter((v) => v.stock <= v.lowStockAlert)
    : variants
  ).map((v) => ({
    id: v.id,
    sku: v.sku,
    size: v.size,
    color: v.color,
    stock: v.stock,
    lowStockAlert: v.lowStockAlert,
    productId: v.product.id,
    productName: v.product.name,
  }));

  const movements = await prisma.stockMovement.findMany({
    take: 25,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      variant: { select: { sku: true, product: { select: { name: true } } } },
    },
  });

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Every change here is written to the stock ledger"
      />

      <SearchBar
        placeholder="Search by product or SKU…"
        filters={[
          {
            name: "lowStock",
            options: [
              { value: "", label: "All stock" },
              { value: "true", label: "Low stock only" },
            ],
          },
        ]}
      />

      <InventoryTable
        rows={rows}
        movements={movements.map((m) => ({
          id: m.id,
          product: m.variant.product.name,
          sku: m.variant.sku,
          quantity: m.quantity,
          reason: m.reason,
          stockAfter: m.stockAfter,
          note: m.note,
          by: m.user?.name ?? "System",
          at: m.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
