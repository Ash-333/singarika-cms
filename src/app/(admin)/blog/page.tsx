import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import SearchBar from "@/components/search-bar";
import DeleteButton from "@/components/delete-button";
import BlogCategoryManager from "@/components/blog-category-manager";

export const dynamic = "force-dynamic";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;

  const [posts, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        ...(sp.status ? { status: sp.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
        ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" as const } } : {}),
      },
      include: {
        coverImage: true,
        category: true,
        author: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Blog"
        subtitle="Styling guides, lookbooks and care tips"
        action={<LinkButton href="/blog/new">Write a post</LinkButton>}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SearchBar
            placeholder="Search posts…"
            filters={[
              {
                name: "status",
                options: [
                  { value: "", label: "All statuses" },
                  { value: "PUBLISHED", label: "Published" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "ARCHIVED", label: "Archived" },
                ],
              },
            ]}
          />

          {posts.length === 0 ? (
            <EmptyState title="No posts yet" hint="Write your first styling guide." />
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4"
                >
                  {p.coverImage ? (
                    <Image
                      src={p.coverImage.secureUrl}
                      alt={p.title}
                      width={80}
                      height={56}
                      className="h-14 w-20 rounded object-cover"
                    />
                  ) : (
                    <div className="h-14 w-20 rounded bg-stone-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/blog/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-stone-500">
                      {p.category?.name ?? "Uncategorised"} · {p.author?.name ?? "Unknown"} ·{" "}
                      {p.readingMinutes ?? 1} min read
                      {p.publishedAt &&
                        ` · ${p.publishedAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}`}
                    </p>
                  </div>
                  <Badge>{p.status}</Badge>
                  <DeleteButton endpoint={`/api/admin/posts/${p.id}`} label={`Delete ${p.title}?`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <BlogCategoryManager
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            postCount: c._count.posts,
          }))}
        />
      </div>
    </>
  );
}
