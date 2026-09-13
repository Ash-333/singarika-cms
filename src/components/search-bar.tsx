"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Filter = { name: string; options: Array<{ value: string; label: string }> };

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

  function apply(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <form
        className="flex-1 min-w-60"
        onSubmit={(e) => {
          e.preventDefault();
          apply("q", String(new FormData(e.currentTarget).get("q") ?? ""));
        }}
      >
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder={placeholder}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-pink-700 focus:outline-none"
        />
      </form>

      {filters.map((f) => (
        <select
          key={f.name}
          defaultValue={params.get(f.name) ?? ""}
          onChange={(e) => apply(f.name, e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-pink-700 focus:outline-none"
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
