import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { handleError, ok } from "@/lib/api";
import { userCreateSchema } from "@/lib/validation";

const publicFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
};

export async function GET() {
  const guard = await requireUser("ADMIN");
  if ("response" in guard) return guard.response;
  try {
    return ok(
      await prisma.user.findMany({ select: publicFields, orderBy: { createdAt: "asc" } }),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireUser("ADMIN");
  if ("response" in guard) return guard.response;
  try {
    const input = userCreateSchema.parse(await req.json());
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        role: input.role,
        passwordHash: await bcrypt.hash(input.password, 12),
      },
      select: publicFields,
    });
    return ok(user, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
