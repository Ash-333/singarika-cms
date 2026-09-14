import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { lowStockVariants } from "@/lib/services/inventory";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { AlertIcon, PlusIcon } from "@/components/icons";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  const [products, activeProducts, categories, posts, draftPosts, media, stock, lowStock, recent] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.category.count(),
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: "DRAFT" } }),
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

  const firstName = (session?.user?.name ?? "").split(" ")[0];

  const tiles = [
    {
      label: "Products",
      value: products,
      hint: `${activeProducts} on the storefront`,
      href: "/products",
    },
    {
      label: "Units in stock",
      value: stock._sum.stock ?? 0,
      hint: `across ${categories} categories`,
      href: "/inventory",
    },
    {
      label: "Needs restocking",
      value: lowStock.length,
      hint: lowStock.length ? "low or sold out" : "all healthy",
      href: "/inventory?lowStock=true",
      alert: lowStock.length > 0,
    },
    {
      label: "Blog posts",
      value: posts,
      hint: draftPosts ? `${draftPosts} still in draft` : "nothing pending",
      href: "/blog",
    },
    { label: "Photos", value: media, hint: "in the library", href: "/media" },
  ];

  return (
    <>
      <PageHeader
        title={firstName ? `Namaste, ${firstName}` : "Dashboard"}
        subtitle="Where the shop stands today."
        action={
          <>
            <LinkButton href="/products/new" size="sm">
              <PlusIcon className="size-4" />
              Add product
            </LinkButton>
            <LinkButton href="/blog/new" variant="secondary" size="sm">
              Write a post
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="group">
            <Card
              className={`h-full transition group-hover:border-primary-ring ${
                t.alert ? "border-danger/30 bg-danger-soft" : ""
              }`}
            >
              <p className="flex items-center gap-1.5 text-sm text-muted">
                {t.alert && <AlertIcon className="size-4 text-danger" />}
                {t.label}
              </p>
              <p
                className={`mt-2 font-display text-4xl leading-none tnum ${
                  t.alert ? "text-danger" : "text-ink"
                }`}
              >
                {t.value}
              </p>
              <p className="mt-2 text-xs text-muted">{t.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <Card padded={false} className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <h2 className="font-display text-lg text-ink">Needs restocking</h2>
            <Link href="/inventory" className="text-sm font-medium text-primary hover:underline">
              Manage stock
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Every variant is above its alert level.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {v.productName}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {[v.size, v.color].filter(Boolean).join(" · ") || v.sku}
                    </span>
                  </span>
                  <Badge tone={v.stock === 0 ? "OUT" : "LOW"}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false} className="lg:col-span-2">
          <div className="border-b border-hairline px-5 py-4">
            <h2 className="font-display text-lg text-ink">Recent stock changes</h2>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Nothing has moved in or out yet.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {recent.map((m) => (
                <li key={m.id} className="px-5 py-3">
                  <div className="flex items-baseline gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {m.variant.product.name}
                    </span>
                    <span
                      className={`shrink-0 text-sm font-medium tnum ${
                        m.quantity > 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {m.reason.charAt(0) + m.reason.slice(1).toLowerCase()} ·{" "}
                    {m.user?.name ?? "System"} · {relativeTime(m.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
