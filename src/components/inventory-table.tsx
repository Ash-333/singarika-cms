"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, EmptyState } from "@/components/ui";

type Row = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  lowStockAlert: number;
  productId: string;
  productName: string;
};

type Movement = {
  id: string;
  product: string;
  sku: string;
  quantity: number;
  reason: string;
  stockAfter: number;
  note: string | null;
  by: string;
  at: string;
};

const REASONS = ["PURCHASE", "SALE", "RETURN", "ADJUSTMENT", "DAMAGE"];

export default function InventoryTable({
  rows,
  movements,
}: {
  rows: Row[];
  movements: Movement[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("PURCHASE");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(variantId: string, direction: 1 | -1) {
    setPending(true);
    setError(null);

    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId,
        quantity: direction * Math.abs(Number(qty || 0)),
        reason,
        note: note || null,
      }),
    });
    const json = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "Could not update stock");
      return;
    }
    setOpenId(null);
    setQty("1");
    setNote("");
    router.refresh();
  }

  if (rows.length === 0) {
    return <EmptyState title="No variants match" hint="Add a product, or clear the filters." />;
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium">In stock</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/products/${r.productId}`} className="font-medium hover:underline">
                      {r.productName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{r.sku}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {[r.size, r.color].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="mr-2 tabular-nums font-medium">{r.stock}</span>
                    {r.stock === 0 ? (
                      <Badge tone="OUT">Out</Badge>
                    ) : r.stock <= r.lowStockAlert ? (
                      <Badge tone="LOW">Low</Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenId(openId === r.id ? null : r.id);
                        setError(null);
                      }}
                      className="text-sm font-medium text-pink-800 hover:underline"
                    >
                      {openId === r.id ? "Close" : "Adjust"}
                    </button>
                  </td>
                </tr>

                {openId === r.id && (
                  <tr className="bg-stone-50">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-stone-500">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-stone-500">Reason</label>
                          <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
                          >
                            {REASONS.map((x) => (
                              <option key={x} value={x}>
                                {x.charAt(0) + x.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="min-w-48 flex-1">
                          <label className="mb-1 block text-xs text-stone-500">Note</label>
                          <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Invoice 2291, stock take…"
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => submit(r.id, 1)}
                          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                        >
                          Add stock
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => submit(r.id, -1)}
                          className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
                        >
                          Remove stock
                        </button>
                      </div>
                      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Stock ledger</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="py-2 font-medium">When</th>
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium">Change</th>
                <th className="py-2 font-medium">After</th>
                <th className="py-2 font-medium">Reason</th>
                <th className="py-2 font-medium">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 text-stone-500">
                    {new Date(m.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="py-2">
                    {m.product} <span className="text-stone-400">{m.sku}</span>
                  </td>
                  <td className={`py-2 tabular-nums ${m.quantity > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="py-2 tabular-nums">{m.stockAfter}</td>
                  <td className="py-2 text-stone-500">
                    {m.reason.charAt(0) + m.reason.slice(1).toLowerCase()}
                    {m.note && <span className="ml-1 text-stone-400">— {m.note}</span>}
                  </td>
                  <td className="py-2 text-stone-500">{m.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
