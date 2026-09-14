import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
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
  const filtered = Boolean(sp.q || sp.status);

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
        subtitle="Styling guides, festival lookbooks and fabric care."
        action={
          <LinkButton href="/blog/new">
            <PlusIcon className="size-4" />
            Write a post
          </LinkButton>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SearchBar
            placeholder="Search post titles"
            filters={[
              {
                name: "status",
                label: "Filter by status",
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
            <EmptyState
              title={filtered ? "No posts match" : "Write your first post"}
              hint={
                filtered
                  ? "Try a different search, or clear the status filter."
                  : "A Dashain lookbook or a guide to caring for pashmina is a good place to start."
              }
              action={
                filtered ? (
                  <LinkButton href="/blog" variant="secondary" size="sm">
                    Clear filters
                  </LinkButton>
                ) : (
                  <LinkButton href="/blog/new">Write a post</LinkButton>
                )
              }
            />
          ) : (
            <ul className="space-y-3">
              {posts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-4 rounded-xl border border-hairline bg-surface p-3 transition hover:border-primary-ring"
                >
                  {p.coverImage ? (
                    <Image
                      src={p.coverImage.secureUrl}
                      alt=""
                      width={80}
                      height={56}
                      className="h-14 w-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-sunk text-xs text-faint">
                      No photo
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/blog/${p.id}`}
                      className="block truncate font-medium text-ink hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-muted">
                      {p.category?.name ?? "No category"} · {p.author?.name ?? "Unknown author"} ·{" "}
                      {p.readingMinutes ?? 1} min read
                      {p.publishedAt && ` · published ${formatDate(p.publishedAt)}`}
                    </p>
                  </div>
                  <Badge>{p.status}</Badge>
                  <DeleteButton
                    endpoint={`/api/admin/posts/${p.id}`}
                    label={`Delete ${p.title}`}
                  />
                </li>
              ))}
            </ul>
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
