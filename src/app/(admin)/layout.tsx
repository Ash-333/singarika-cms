import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import NavLink from "@/components/nav-link";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/inventory", label: "Inventory" },
  { href: "/blog", label: "Blog" },
  { href: "/media", label: "Media" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lowStock = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count FROM product_variants
    WHERE "isActive" = true AND stock <= "lowStockAlert"
  `;
  const lowStockCount = Number(lowStock[0]?.count ?? 0);

  const links = session.user.role === "ADMIN" ? [...nav, { href: "/users", label: "Users" }] : nav;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-stone-200 bg-white md:block">
        <div className="px-5 py-6">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-pink-900">
            Singarika
          </Link>
          <p className="mt-0.5 text-xs text-stone-400">Store CMS</p>
        </div>
        <nav className="space-y-0.5 px-3">
          {links.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label}
              badge={item.href === "/inventory" && lowStockCount > 0 ? lowStockCount : undefined} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
          <div className="flex gap-3 overflow-x-auto md:hidden">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-stone-600">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-stone-600">
              {session.user.name}
              <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                {session.user.role}
              </span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="text-sm text-stone-500 hover:text-stone-800">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
