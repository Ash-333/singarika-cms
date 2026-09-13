import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { upsertTags } from "@/lib/services/tags";
import { postCreateSchema, postUpdateSchema } from "@/lib/validation";

type CreateInput = z.infer<typeof postCreateSchema>;
type UpdateInput = z.infer<typeof postUpdateSchema>;

export const postInclude = {
  coverImage: true,
  category: true,
  author: { select: { id: true, name: true } },
  tags: { include: { tag: true } },
};

/** ~200 words per minute over the editor HTML, minimum 1. */
export function readingMinutes(html: string) {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function scalars(input: Partial<CreateInput>) {
  return {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
    ...(input.content !== undefined && {
      content: input.content,
      readingMinutes: readingMinutes(input.content),
    }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.coverImageId !== undefined && { coverImageId: input.coverImageId }),
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
    ...(input.metaDescription !== undefined && { metaDescription: input.metaDescription }),
  };
}

export async function createPost(input: CreateInput, authorId: string) {
  const slug = await uniqueSlug("blogPost", input.slug || input.title);
  const tagIds = await upsertTags(input.tagNames);

  return prisma.blogPost.create({
    data: {
      ...scalars(input),
      title: input.title,
      content: input.content,
      slug,
      authorId,
      publishedAt:
        input.publishedAt ?? (input.status === "PUBLISHED" ? new Date() : null),
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: postInclude,
  });
}

export async function updatePost(id: string, input: UpdateInput) {
  const current = await prisma.blogPost.findUniqueOrThrow({
    where: { id },
    select: { slug: true, status: true, publishedAt: true },
  });

  const slug =
    input.slug || input.title
      ? await uniqueSlug("blogPost", input.slug || input.title!, id)
      : current.slug;

  if (input.tagNames) {
    const tagIds = await upsertTags(input.tagNames);
    await prisma.tagOnPost.deleteMany({ where: { postId: id } });
    await prisma.tagOnPost.createMany({
      data: tagIds.map((tagId) => ({ postId: id, tagId })),
    });
  }

  const publishingNow = input.status === "PUBLISHED" && !current.publishedAt;

  return prisma.blogPost.update({
    where: { id },
    data: {
      ...scalars(input),
      slug,
      ...(input.publishedAt !== undefined
        ? { publishedAt: input.publishedAt }
        : publishingNow
          ? { publishedAt: new Date() }
          : {}),
    },
    include: postInclude,
  });
}
