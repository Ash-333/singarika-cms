import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: { message, details: extra } }, { status });
}

export function paginated<T>(
  items: T[],
  meta: { page: number; perPage: number; total: number },
) {
  return NextResponse.json({
    data: items,
    meta: { ...meta, totalPages: Math.max(1, Math.ceil(meta.total / meta.perPage)) },
  });
}

/** Single place where thrown errors become HTTP responses. */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation failed", 422, error.flatten());
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ");
      return fail(`A record with this ${target ?? "value"} already exists`, 409);
    }
    if (error.code === "P2025") return fail("Not found", 404);
    if (error.code === "P2003") return fail("Related record is missing", 409);
  }
  console.error(error);
  return fail("Internal server error", 500);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, Number(searchParams.get("perPage") ?? 20) || 20),
  );
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}
