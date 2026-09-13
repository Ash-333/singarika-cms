import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import SearchBar from "@/components/search-bar";
import DeleteButton from "@/components/delete-button";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const perPage = 20;

  const where = {
    ...(sp.status ? { status: sp.status as "DRAFT" | "ACTIVE" | "ARCHIVED" } : {}),
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: "insensitive" as const } },
            { variants: { some: { sku: { contains: sp.q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { include: { media: true }, orderBy: { position: "asc" }, take: 1 },
        variants: true,
        categories: { include: { category: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${total} product${total === 1 ? "" : "s"} in the catalogue`}
        action={<LinkButton href="/products/new">Add product</LinkButton>}
      />

      <SearchBar
        placeholder="Search by name or SKU…"
        filters={[
          {
            name: "status",
            options: [
              { value: "", label: "All statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "DRAFT", label: "Draft" },
              { value: "ARCHIVED", label: "Archived" },
            ],
          },
        ]}
      />

      {products.length === 0 ? (
        <EmptyState title="No products yet" hint="Add your first saree, lehenga or kurta set." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => {
                const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                const image = p.images[0]?.media;
                return (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <Link href={`/products/${p.id}`} className="flex items-center gap-3">
                        {image ? (
                          <Image
                            src={image.secureUrl}
                            alt={p.name}
                            width={40}
                            height={52}
                            className="h-13 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-13 w-10 rounded bg-stone-100" />
                        )}
                        <span>
                          <span className="font-medium text-stone-900">{p.name}</span>
                          <span className="block text-xs text-stone-400">
                            {p.variants.length} variant{p.variants.length === 1 ? "" : "s"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {p.categories.map((c) => c.category.name).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatINR(p.basePrice)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={stock === 0 ? "text-rose-600" : ""}>{stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteButton
                        endpoint={`/api/admin/products/${p.id}`}
                        label={`Delete "${p.name}"?`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/products?page=${n}${sp.q ? `&q=${sp.q}` : ""}${sp.status ? `&status=${sp.status}` : ""}`}
              className={`rounded px-3 py-1.5 ${
                n === page ? "bg-pink-800 text-white" : "border border-stone-300 bg-white"
              }`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
