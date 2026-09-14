"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchIcon, CloseIcon } from "@/components/icons";
import { inputClass } from "@/components/ui";

type Filter = { name: string; label: string; options: Array<{ value: string; label: string }> };

export default function SearchBar({
  placeholder = "Search…",
  filters = [],
}: {
  placeholder?: string;
  filters?: Filter[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  function apply(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <form
        className="relative min-w-60 flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          apply("q", String(new FormData(e.currentTarget).get("q") ?? "").trim());
        }}
      >
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
        <input
          key={query}
          name="q"
          type="search"
          aria-label={placeholder}
          defaultValue={query}
          placeholder={placeholder}
          className={`${inputClass} pl-10 ${query ? "pr-10" : ""}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => apply("q", "")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
          >
            <CloseIcon className="size-4" />
          </button>
        )}
      </form>

      {filters.map((f) => (
        <select
          key={f.name}
          aria-label={f.label}
          defaultValue={params.get(f.name) ?? ""}
          onChange={(e) => apply(f.name, e.target.value)}
          className={`${inputClass} w-auto min-w-40`}
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
