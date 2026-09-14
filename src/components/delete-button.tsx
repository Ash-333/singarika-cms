"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/icons";

/**
 * Two-step delete — the first click arms it, the second sends the request.
 * Avoids window.confirm so the admin never blocks on a native dialog.
 */
export default function DeleteButton({
  endpoint,
  label,
  onDone,
}: {
  endpoint: string;
  /** Names the thing being deleted, e.g. `Delete "Dhaka kurta"?` */
  label: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    setPending(false);
    setArmed(false);

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error?.message ?? "That could not be deleted.");
      return;
    }
    onDone?.();
    router.refresh();
  }

  if (error) {
    return <span className="text-xs text-danger">{error}</span>;
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        title={label}
        aria-label={label}
        className="rounded-lg p-2 text-faint transition hover:bg-danger-soft hover:text-danger"
      >
        <TrashIcon className="size-4" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="rounded-lg bg-danger px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-xs text-muted hover:text-ink"
      >
        Keep
      </button>
    </span>
  );
}
