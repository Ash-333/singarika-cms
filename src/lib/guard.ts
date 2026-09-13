import { auth } from "@/auth";
import { fail } from "@/lib/api";

export type SessionUser = { id: string; email: string; name: string; role: "ADMIN" | "EDITOR" };

/**
 * Guards an /api/admin route. Returns either the signed-in user or the
 * response to send back, so handlers read:
 *   const guard = await requireUser(); if ("response" in guard) return guard.response;
 */
export async function requireUser(
  role?: "ADMIN",
): Promise<{ user: SessionUser } | { response: Response }> {
  const session = await auth();
  if (!session?.user?.id) return { response: fail("Unauthorized", 401) };
  if (role === "ADMIN" && session.user.role !== "ADMIN") {
    return { response: fail("Forbidden — admin only", 403) };
  }
  return { user: session.user as SessionUser };
}
