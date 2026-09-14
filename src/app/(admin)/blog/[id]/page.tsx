import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostForm from "@/components/post-form";
import { Badge, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: { coverImage: true, tags: { include: { tag: true } } },
    }),
    prisma.blogCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();

  return (
    <>
      <Link href="/blog" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Blog
      </Link>
      <PageHeader
        title={post.title}
        subtitle={`Last saved ${formatDate(post.updatedAt)} · /${post.slug}`}
        action={<Badge>{post.status}</Badge>}
      />
      <PostForm
        categories={categories}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          status: post.status,
          categoryId: post.categoryId ?? "",
          tags: post.tags.map((t) => t.tag.name).join(", "),
          metaTitle: post.metaTitle ?? "",
          metaDescription: post.metaDescription ?? "",
          coverImage: post.coverImage
            ? [
                {
                  id: post.coverImage.id,
                  secureUrl: post.coverImage.secureUrl,
                  altText: post.coverImage.altText,
                  width: post.coverImage.width,
                  height: post.coverImage.height,
                },
              ]
            : [],
        }}
      />
    </>
  );
}
