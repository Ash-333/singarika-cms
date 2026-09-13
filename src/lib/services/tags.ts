import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";

/** Finds or creates tags by name and returns their ids. */
export async function upsertTags(names: string[]) {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const ids: string[] = [];
  for (const name of unique) {
    const slug = toSlug(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
      select: { id: true },
    });
    ids.push(tag.id);
  }
  return ids;
}
