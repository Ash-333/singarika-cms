import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import UserManager from "@/components/user-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader title="Users" subtitle="Who can sign in to the CMS" />
      <UserManager users={users} currentUserId={session.user.id} />
    </>
  );
}
