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
      <PageHeader title="New post" />
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
