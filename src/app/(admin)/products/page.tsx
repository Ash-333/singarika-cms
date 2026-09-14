import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatNPR } from "@/lib/money";
import { Badge, EmptyState, LinkButton, PageHeader, TableShell, Th } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import SearchBar from "@/components/search-bar";
import DeleteButton from "@/components/delete-button";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

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
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const filtered = Boolean(sp.q || sp.status);
  const pageUrl = (n: number) =>
    `/products?page=${n}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}${
      sp.status ? `&status=${sp.status}` : ""
    }`;

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={
          total === 0
            ? "Nothing in the catalogue yet."
            : `${total} product${total === 1 ? "" : "s"}${filtered ? " match your filters" : " in the catalogue"}`
        }
        action={
          <LinkButton href="/products/new">
            <PlusIcon className="size-4" />
            Add product
          </LinkButton>
        }
      />

      <SearchBar
        placeholder="Search by product name or SKU"
        filters={[
          {
            name: "status",
            label: "Filter by status",
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
        filtered ? (
          <EmptyState
            title="No products match"
            hint="Try a different spelling, or clear the status filter."
            action={
              <LinkButton href="/products" variant="secondary" size="sm">
                Clear filters
              </LinkButton>
            }
          />
        ) : (
          <EmptyState
            title="Add your first product"
            hint="A Dhaka kurtha suruwal, a sari, a pashmina shawl — whatever the shop is selling today."
            action={<LinkButton href="/products/new">Add product</LinkButton>}
          />
        )
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th align="right">Price</Th>
              <Th align="right">Stock</Th>
              <Th>Status</Th>
              <Th className="w-px">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {products.map((p) => {
              const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
              const image = p.images[0]?.media;
              return (
                <tr key={p.id} className="transition hover:bg-sunk">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}`} className="flex items-center gap-3">
                      {image ? (
                        <Image
                          src={image.secureUrl}
                          alt=""
                          width={40}
                          height={52}
                          className="h-13 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <span className="h-13 w-10 shrink-0 rounded bg-sunk" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{p.name}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {p.variants.length} variant{p.variants.length === 1 ? "" : "s"}
                          {p.isFeatured && " · featured"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {p.categories.map((c) => c.category.name).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tnum">
                    {formatNPR(p.basePrice)}
                  </td>
                  <td className="px-4 py-3 text-right tnum">
                    <span className={stock === 0 ? "font-medium text-danger" : "text-ink"}>
                      {stock === 0 ? "Sold out" : stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <DeleteButton
                      endpoint={`/api/admin/products/${p.id}`}
                      label={`Delete ${p.name}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-5 flex items-center justify-between gap-3 text-sm"
        >
          <p className="text-muted">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="rounded-lg border border-hairline-strong bg-surface px-3 py-2 font-medium hover:bg-sunk"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className="rounded-lg border border-hairline-strong bg-surface px-3 py-2 font-medium hover:bg-sunk"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
