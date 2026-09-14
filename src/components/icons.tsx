/**
 * A small hand-rolled icon set. Everything is a 20×20 stroke glyph that
 * inherits `currentColor`, so icons pick up the colour of whatever they label.
 */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function DashboardIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="2.5" width="6" height="7" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="4" rx="1.5" />
      <rect x="2.5" y="12.5" width="6" height="5" rx="1.5" />
      <rect x="11.5" y="9.5" width="6" height="8" rx="1.5" />
    </svg>
  );
}

export function ProductIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 6.2 10 2.5l7 3.7v7.6L10 17.5l-7-3.7z" />
      <path d="M3 6.2 10 10l7-3.8M10 10v7.5" />
    </svg>
  );
}

export function CategoryIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="3" width="6" height="5" rx="1.5" />
      <path d="M5.5 8v6.5h4M9.5 14.5h-4" />
      <rect x="11.5" y="5.5" width="6" height="3.5" rx="1.2" />
      <rect x="11.5" y="12.5" width="6" height="3.5" rx="1.2" />
    </svg>
  );
}

export function InventoryIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="9.5" width="6.5" height="7.5" rx="1.2" />
      <rect x="11" y="9.5" width="6.5" height="7.5" rx="1.2" />
      <rect x="6.75" y="2.5" width="6.5" height="6" rx="1.2" />
    </svg>
  );
}

export function BlogIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M13.2 2.8a1.9 1.9 0 0 1 2.7 2.7l-8 8-3.4.7.7-3.4z" />
      <path d="M3 17.2h14" />
    </svg>
  );
}

export function MediaIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <circle cx="7" cy="8" r="1.4" />
      <path d="M3 13.5 7.5 10l3.2 2.6L13.5 10l3.5 3.2" />
    </svg>
  );
}

export function UsersIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="7" r="3" />
      <path d="M2.5 16.5c.6-2.8 2.8-4.3 5.5-4.3s4.9 1.5 5.5 4.3" />
      <path d="M13.5 4.5a2.8 2.8 0 0 1 0 5.4M15.5 12.6c1.3.6 2.1 1.9 2.4 3.6" />
    </svg>
  );
}

export function SearchIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8.8" cy="8.8" r="5.3" />
      <path d="m12.8 12.8 4 4" />
    </svg>
  );
}

export function PlusIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 4.5v11M4.5 10h11" />
    </svg>
  );
}

export function AlertIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 3.2 17.5 16H2.5z" />
      <path d="M10 8v3.4M10 13.8h.01" />
    </svg>
  );
}

export function MenuIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

export function CloseIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export function ChevronIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m7.5 4.5 5 5.5-5 5.5" />
    </svg>
  );
}

export function TrashIcon({ className = "size-4" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
      <path d="M5.5 5.5 6.3 16a1 1 0 0 0 1 .9h5.4a1 1 0 0 0 1-.9l.8-10.5" />
    </svg>
  );
}
