"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card } from "@/components/ui";

type User = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
  isActive: boolean;
};

const field =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-pink-700 focus:outline-none";

export default function UserManager({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EDITOR" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "Could not create the user");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "EDITOR" });
    router.refresh();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white lg:col-span-2">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-stone-400">you</span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={u.id === currentUserId}
                    onChange={(e) => patch(u.id, { role: e.target.value })}
                    className="rounded border border-stone-300 px-2 py-1 text-sm disabled:bg-stone-100"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.id === currentUserId ? (
                    <Badge tone="ACTIVE">Active</Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => patch(u.id, { isActive: !u.isActive })}
                      className="text-sm text-pink-800 hover:underline"
                    >
                      {u.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Invite a user</h2>
        <form onSubmit={create} className="space-y-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={field}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={field}
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={field}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={field}
          >
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </select>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-pink-800 px-4 py-2 text-sm font-medium text-white hover:bg-pink-900 disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create user"}
          </button>
        </form>
      </Card>
    </div>
  );
}
