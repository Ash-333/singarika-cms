import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { lowStockVariants } from "@/lib/services/inventory";
import { Badge, Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [products, activeProducts, categories, posts, publishedPosts, media, stock, lowStock, recent] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.category.count(),
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      prisma.media.count(),
      prisma.productVariant.aggregate({ _sum: { stock: true } }),
      lowStockVariants(8),
      prisma.stockMovement.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          variant: { select: { sku: true, product: { select: { name: true } } } },
          user: { select: { name: true } },
        },
      }),
    ]);

  const tiles = [
    { label: "Products", value: products, hint: `${activeProducts} live`, href: "/products" },
    { label: "Categories", value: categories, hint: "catalogue tree", href: "/categories" },
    { label: "Units in stock", value: stock._sum.stock ?? 0, hint: `${lowStock.length} low`, href: "/inventory" },
    { label: "Blog posts", value: posts, hint: `${publishedPosts} published`, href: "/blog" },
    { label: "Media", value: media, hint: "Cloudinary assets", href: "/media" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Catalogue and content at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <Card className="transition hover:border-pink-300">
              <p className="text-sm text-stone-500">{t.label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{t.value}</p>
              <p className="mt-1 text-xs text-stone-400">{t.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone-500">Everything is comfortably stocked.</p>
          ) : (
            <ul className="divide-y divide-stone-100 text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="font-medium">{v.productName}</span>
                    <span className="ml-2 text-stone-400">
                      {[v.size, v.color].filter(Boolean).join(" / ") || v.sku}
                    </span>
                  </span>
                  <Badge tone={v.stock === 0 ? "OUT" : "LOW"}>
                    {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-medium">Recent stock movements</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-stone-500">No movements recorded yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100 text-sm">
              {recent.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{m.variant.product.name}</span>
                    <span className="ml-2 text-stone-400">{m.variant.sku}</span>
                  </span>
                  <span className="ml-3 shrink-0 text-stone-500">
                    <span className={m.quantity > 0 ? "text-emerald-700" : "text-rose-700"}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                    <span className="ml-2 text-xs uppercase tracking-wide">{m.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
