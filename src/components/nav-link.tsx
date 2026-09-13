"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
        active ? "bg-pink-50 font-medium text-pink-900" : "text-stone-600 hover:bg-stone-50"
      }`}
    >
      {label}
      {badge ? (
        <span className="rounded-full bg-rose-100 px-1.5 text-xs font-medium text-rose-700">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
