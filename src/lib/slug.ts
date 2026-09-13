import slugify from "slugify";
import { prisma } from "@/lib/prisma";

type SlugModel = "product" | "category" | "blogPost" | "blogCategory" | "tag";

export function toSlug(input: string) {
  return slugify(input, { lower: true, strict: true, trim: true });
}

/**
 * Returns a slug unique within the given table, appending -2, -3 ... on clash.
 * `ignoreId` lets an existing row keep its own slug while editing.
 */
export async function uniqueSlug(
  model: SlugModel,
  source: string,
  ignoreId?: string,
) {
  const base = toSlug(source) || "item";
  let candidate = base;
  let n = 1;

  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma[model] as any).findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === ignoreId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
