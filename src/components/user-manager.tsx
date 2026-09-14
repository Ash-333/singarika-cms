"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Field,
  Input,
  Notice,
  Section,
  Select,
  TableShell,
  Th,
} from "@/components/ui";

type User = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
  isActive: boolean;
};

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
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setDone(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(json?.error?.message ?? "That account could not be created.");
      return;
    }
    setDone(`${form.name} can now sign in with the password you set.`);
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
    <div className="grid items-start gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <TableShell>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Can do</Th>
              <Th align="right">Access</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {users.map((u) => (
              <tr key={u.id} className={u.isActive ? "" : "bg-sunk"}>
                <td className="px-4 py-3 font-medium text-ink">
                  {u.name}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-muted">you</span>}
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <Select
                    aria-label={`Role for ${u.name}`}
                    value={u.role}
                    disabled={u.id === currentUserId}
                    onChange={(e) => patch(u.id, { role: e.target.value })}
                    className="w-auto py-1.5 text-sm"
                  >
                    <option value="ADMIN">Everything, including the team</option>
                    <option value="EDITOR">Products, stock and the blog</option>
                  </Select>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id === currentUserId ? (
                    <Badge tone="ACTIVE">Active</Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      onClick={() => patch(u.id, { isActive: !u.isActive })}
                    >
                      {u.isActive ? "Remove access" : "Restore access"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <Section title="Add someone" description="They sign in with the password you set here.">
        <form onSubmit={create} className="space-y-4">
          <Field label="Name" required>
            {(id) => (
              <Input
                id={id}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Email" required>
            {(id) => (
              <Input
                id={id}
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
          </Field>
          <Field label="First password" required hint="At least 8 characters. Ask them to change it.">
            {(id) => (
              <Input
                id={id}
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
          </Field>
          <Field label="They can">
            {(id) => (
              <Select
                id={id}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="EDITOR">Manage products, stock and the blog</option>
                <option value="ADMIN">Do everything, including the team</option>
              </Select>
            )}
          </Field>

          {error && <Notice>{error}</Notice>}
          {done && <Notice tone="success">{done}</Notice>}

          <Button type="submit" size="sm" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
      </Section>
    </div>
  );
}
