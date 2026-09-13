import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
  ARCHIVED: "bg-stone-100 text-stone-600 ring-stone-200",
  LOW: "bg-rose-50 text-rose-700 ring-rose-200",
  OUT: "bg-rose-100 text-rose-800 ring-rose-300",
};

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const cls = badgeTones[tone ?? String(children)] ?? "bg-stone-100 text-stone-600 ring-stone-200";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {children}
    </span>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-pink-800 text-white hover:bg-pink-900"
      : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50";
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition ${styles}`}
    >
      {children}
    </Link>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <p className="font-medium text-stone-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
    </div>
  );
}
