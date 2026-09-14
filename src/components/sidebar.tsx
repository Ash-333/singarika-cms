"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BlogIcon,
  CategoryIcon,
  CloseIcon,
  DashboardIcon,
  InventoryIcon,
  MediaIcon,
  MenuIcon,
  ProductIcon,
  UsersIcon,
} from "@/components/icons";

export type NavItem = { href: string; label: string; badge?: number };
export type NavGroup = { heading: string; items: NavItem[] };

const icons: Record<string, (p: { className?: string }) => ReactNode> = {
  "/dashboard": DashboardIcon,
  "/products": ProductIcon,
  "/categories": CategoryIcon,
  "/inventory": InventoryIcon,
  "/blog": BlogIcon,
  "/media": MediaIcon,
  "/users": UsersIcon,
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6 px-3">
      {groups.map((group) => (
        <div key={group.heading}>
          <p className="px-3 pb-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-rail-muted">
            {group.heading}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = icons[item.href] ?? DashboardIcon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-rail-hover font-medium text-white"
                        : "text-rail-ink/80 hover:bg-rail-hover/60 hover:text-white"
                    }`}
                  >
                    <Icon className={`size-5 ${active ? "text-white" : "text-rail-muted"}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span
                        className="rounded-full bg-crimson px-2 py-0.5 text-[0.6875rem] font-semibold text-white"
                        title={`${item.badge} variants need restocking`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Wordmark({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/dashboard" onClick={onNavigate} className="block px-5 py-6">
      <span className="font-display text-2xl tracking-tight text-white">Singarika</span>
      <span className="mt-1 block text-xs text-rail-muted">Catalogue &amp; content</span>
    </Link>
  );
}

function UserChip({ name, role, signOut }: { name: string; role: string; signOut: ReactNode }) {
  return (
    <div className="mt-auto border-t border-white/10 px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-crimson text-sm font-semibold text-white">
          {initials(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-white">{name}</span>
          <span className="block text-xs text-rail-muted">
            {role === "ADMIN" ? "Admin" : "Editor"}
          </span>
        </span>
      </div>
      <div className="mt-3">{signOut}</div>
    </div>
  );
}

export default function Sidebar({
  groups,
  user,
  signOut,
}: {
  groups: NavGroup[];
  user: { name: string; role: string };
  signOut: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Escape closes the drawer; every link inside it closes on navigation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:flex">
        <div className="flex flex-1 flex-col bg-rail">
          <Wordmark />
          <NavList groups={groups} />
          <UserChip name={user.name} role={user.role} signOut={signOut} />
        </div>
        <div className="dhaka-edge w-1" aria-hidden />
      </aside>

      {/* Mobile bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-rail px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="rounded-lg p-1.5 text-rail-ink hover:bg-rail-hover"
        >
          <MenuIcon className="size-6" />
        </button>
        <Link href="/dashboard" className="font-display text-xl text-white">
          Singarika
        </Link>
        <span className="ml-auto grid size-8 place-items-center rounded-full bg-crimson text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-rail">
            <div className="flex items-start justify-between">
              <Wordmark onNavigate={() => setOpen(false)} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="m-4 rounded-lg p-1.5 text-rail-ink hover:bg-rail-hover"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList groups={groups} onNavigate={() => setOpen(false)} />
            </div>
            <UserChip name={user.name} role={user.role} signOut={signOut} />
          </div>
        </div>
      )}
    </>
  );
}
