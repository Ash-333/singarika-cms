"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  label: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    setPending(false);
    setArmed(false);
    if (res.ok) {
      onDone?.();
      router.refresh();
    }
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        title={label}
        className="text-sm text-stone-400 hover:text-rose-600"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="font-medium text-rose-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Confirm"}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="text-stone-400">
        Cancel
      </button>
    </span>
  );
}
