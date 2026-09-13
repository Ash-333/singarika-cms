"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import DeleteButton from "@/components/delete-button";

export default function BlogCategoryManager({
  categories,
}: {
  categories: Array<{ id: string; name: string; slug: string; postCount: number }>;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const res = await fetch("/api/admin/blog-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "Could not create the category");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="mb-3 font-medium">Blog categories</h2>

      <ul className="mb-4 divide-y divide-stone-100 text-sm">
        {categories.length === 0 && <li className="py-2 text-stone-500">None yet.</li>}
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <span>
              {c.name}
              <span className="ml-2 text-xs text-stone-400">{c.postCount}</span>
            </span>
            <DeleteButton
              endpoint={`/api/admin/blog-categories/${c.id}`}
              label={`Delete ${c.name}?`}
            />
          </li>
        ))}
      </ul>

      <form onSubmit={create} className="flex gap-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Styling Guides"
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-pink-700 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-pink-800 px-3 py-2 text-sm font-medium text-white hover:bg-pink-900 disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </Card>
  );
}
