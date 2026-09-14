import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

/* ------------------------------------------------------------------ surfaces */

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-hairline bg-surface shadow-[0_1px_2px_rgba(34,31,28,0.04)] ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** A card with a titled header — the standard block inside an editor screen. */
export function Section({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card padded={false} className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div>
          <h2 className="font-display text-lg leading-tight text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- actions */

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-55";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-hairline-strong bg-surface text-ink hover:bg-sunk",
  danger: "bg-danger text-white hover:brightness-95",
  quiet: "text-primary hover:bg-primary-soft",
} as const;

const sizes = {
  md: "px-4 py-2.5",
  sm: "px-3 py-2 text-[0.8125rem]",
} as const;

export type ButtonVariant = keyof typeof variants;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      {...props}
      className={`${buttonBase} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonBase} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------- inputs */

export const inputClass =
  "w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-faint transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft disabled:bg-sunk disabled:text-muted";

/** Label + control + hint, wired together so the label is always clickable. */
export function Field({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  /** Receives the generated id — spread it onto the control. */
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="ml-1 text-crimson">*</span>}
      </label>
      {children(id)}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${className}`} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${className}`} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${className}`} />;
}

/** Price input with the rupee mark inside the control, so the unit is never in doubt. */
export function MoneyInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
        रु
      </span>
      <input
        type="number"
        min="0"
        {...props}
        className={`${inputClass} pl-9 ${className}`}
      />
    </div>
  );
}

export function Checkbox({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className={`flex gap-2.5 ${className}`}>
      <input
        id={id}
        type="checkbox"
        {...props}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]"
      />
      <label htmlFor={id} className="text-sm text-ink-soft">
        {label}
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ feedback */

const badgeTones: Record<string, string> = {
  ACTIVE: "bg-success-soft text-success ring-success/20",
  PUBLISHED: "bg-success-soft text-success ring-success/20",
  DRAFT: "bg-warn-soft text-warn ring-warn/20",
  ARCHIVED: "bg-sunk text-muted ring-hairline-strong",
  HIDDEN: "bg-sunk text-muted ring-hairline-strong",
  LOW: "bg-warn-soft text-warn ring-warn/25",
  OUT: "bg-danger-soft text-danger ring-danger/25",
  INFO: "bg-primary-soft text-primary ring-primary/20",
};

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const cls = badgeTones[tone ?? String(children)] ?? badgeTones.ARCHIVED;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium first-letter:uppercase ring-1 ring-inset ${cls}`}
    >
      {typeof children === "string" ? children.toLowerCase() : children}
    </span>
  );
}

/** Inline message. Errors say what happened; they never apologise. */
export function Notice({
  tone = "error",
  children,
  className = "",
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    error: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
    info: "bg-primary-soft text-primary",
  };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3 py-2 text-sm ${tones[tone]} ${className}`}
    >
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-hairline-strong bg-surface px-6 py-14 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------- tables */

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`bg-sunk px-4 py-3 text-xs font-semibold tracking-wide text-muted ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}
