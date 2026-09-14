"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Notice,
  Select,
  TableShell,
  Th,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";

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

/** Plain-language names for the ledger reasons the API accepts. */
const REASONS = [
  { value: "PURCHASE", label: "New stock arrived" },
  { value: "SALE", label: "Sold" },
  { value: "RETURN", label: "Customer returned it" },
  { value: "ADJUSTMENT", label: "Stock count correction" },
  { value: "DAMAGE", label: "Damaged or lost" },
];

const reasonLabel = (reason: string) =>
  REASONS.find((r) => r.value === reason)?.label ??
  reason.charAt(0) + reason.slice(1).toLowerCase();

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

  function toggle(id: string) {
    setOpenId(openId === id ? null : id);
    setQty("1");
    setNote("");
    setReason("PURCHASE");
    setError(null);
  }

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
      setError(json?.error?.message ?? "The stock count could not be changed.");
      return;
    }
    setOpenId(null);
    setQty("1");
    setNote("");
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing to count"
        hint="Add a product with at least one size, or clear the filters above."
      />
    );
  }

  return (
    <div className="space-y-6">
      <TableShell>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Size &amp; colour</Th>
            <Th>SKU</Th>
            <Th align="right">In stock</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r) => {
            const open = openId === r.id;
            return (
              <Fragment key={r.id}>
                <tr className={open ? "bg-primary-soft" : "transition hover:bg-sunk"}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${r.productId}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {r.productName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {[r.size, r.color].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{r.sku}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="mr-2 font-medium tnum">{r.stock}</span>
                    {r.stock === 0 ? (
                      <Badge tone="OUT">Sold out</Badge>
                    ) : r.stock <= r.lowStockAlert ? (
                      <Badge tone="LOW">Low</Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant={open ? "secondary" : "quiet"}
                      size="sm"
                      aria-expanded={open}
                      onClick={() => toggle(r.id)}
                    >
                      {open ? "Cancel" : "Change count"}
                    </Button>
                  </td>
                </tr>

                {open && (
                  <tr className="bg-primary-soft">
                    <td colSpan={5} className="px-4 pb-5 pt-1">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[7rem_16rem_1fr]">
                        <Field label="How many">
                          {(id) => (
                            <Input
                              id={id}
                              type="number"
                              min="1"
                              autoFocus
                              value={qty}
                              onChange={(e) => setQty(e.target.value)}
                            />
                          )}
                        </Field>
                        <Field label="Why">
                          {(id) => (
                            <Select
                              id={id}
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            >
                              {REASONS.map((x) => (
                                <option key={x.value} value={x.value}>
                                  {x.label}
                                </option>
                              ))}
                            </Select>
                          )}
                        </Field>
                        <Field label="Note" hint="Optional — a bill number or who counted.">
                          {(id) => (
                            <Input
                              id={id}
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="Bill 2291"
                            />
                          )}
                        </Field>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          onClick={() => submit(r.id, 1)}
                        >
                          Add {qty || 0} to stock
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={pending}
                          onClick={() => submit(r.id, -1)}
                        >
                          Take {qty || 0} out
                        </Button>
                      </div>

                      {error && <Notice className="mt-3">{error}</Notice>}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </TableShell>

      <Card padded={false}>
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="font-display text-lg text-ink">Stock ledger</h2>
          <p className="mt-1 text-sm text-muted">
            Every change, in order. Nothing here can be edited or removed.
          </p>
        </div>
        {movements.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Item</Th>
                  <Th align="right">Change</Th>
                  <Th align="right">Left</Th>
                  <Th>Why</Th>
                  <Th>Who</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                      {formatDateTime(m.at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-ink">{m.product}</span>
                      <span className="ml-2 font-mono text-xs text-muted">{m.sku}</span>
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-medium tnum ${
                        m.quantity > 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right tnum">{m.stockAfter}</td>
                    <td className="px-4 py-2.5 text-muted">
                      {reasonLabel(m.reason)}
                      {m.note && <span className="ml-1 text-faint">— {m.note}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{m.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
