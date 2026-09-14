import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import Sidebar, { type NavGroup } from "@/components/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lowStock = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count FROM product_variants
    WHERE "isActive" = true AND stock <= "lowStockAlert"
  `;
  const lowStockCount = Number(lowStock[0]?.count ?? 0);

  const groups: NavGroup[] = [
    { heading: "Overview", items: [{ href: "/dashboard", label: "Dashboard" }] },
    {
      heading: "Shop",
      items: [
        { href: "/products", label: "Products" },
        { href: "/categories", label: "Categories" },
        { href: "/inventory", label: "Stock", badge: lowStockCount || undefined },
      ],
    },
    {
      heading: "Content",
      items: [
        { href: "/blog", label: "Blog" },
        { href: "/media", label: "Photos" },
      ],
    },
  ];

  if (session.user.role === "ADMIN") {
    groups.push({ heading: "Settings", items: [{ href: "/users", label: "Team" }] });
  }

  const signOutForm = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-rail-ink transition hover:bg-rail-hover hover:text-white"
      >
        Sign out
      </button>
    </form>
  );

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        groups={groups}
        user={{ name: session.user.name ?? "Signed in", role: session.user.role }}
        signOut={signOutForm}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[75rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
