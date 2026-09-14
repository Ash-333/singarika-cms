import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PostForm from "@/components/post-form";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const categories = await prisma.blogCategory.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Link href="/blog" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Blog
      </Link>
      <PageHeader title="New post" subtitle="Saved as a draft until you publish it." />
      <PostForm
        categories={categories}
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          status: "DRAFT",
          categoryId: "",
          tags: "",
          metaTitle: "",
          metaDescription: "",
          coverImage: [],
        }}
      />
    </>
  );
}
