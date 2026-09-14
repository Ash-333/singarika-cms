"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Notice, Section } from "@/components/ui";
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
      setError(json?.error?.message ?? "That category could not be created.");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <Section title="Blog categories" description="Group posts so readers can browse them.">
      <ul className="mb-4 divide-y divide-hairline text-sm">
        {categories.length === 0 && (
          <li className="py-2 text-muted">None yet — add one below.</li>
        )}
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 py-2">
            <span className="min-w-0 truncate text-ink">
              {c.name}
              <span className="ml-2 text-xs text-muted">
                {c.postCount} post{c.postCount === 1 ? "" : "s"}
              </span>
            </span>
            <DeleteButton
              endpoint={`/api/admin/blog-categories/${c.id}`}
              label={`Delete ${c.name}`}
            />
          </li>
        ))}
      </ul>

      <form onSubmit={create} className="flex gap-2">
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="New category name"
          placeholder="Festival styling"
        />
        <Button type="submit" size="sm" disabled={pending}>
          Add
        </Button>
      </form>
      {error && <Notice className="mt-2">{error}</Notice>}
    </Section>
  );
}
