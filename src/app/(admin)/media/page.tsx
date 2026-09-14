import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import MediaLibrary from "@/components/media-library";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
    include: { _count: { select: { productImages: true, categories: true, postCovers: true } } },
  });

  return (
    <>
      <PageHeader
        title="Photos"
        subtitle="Every image used across the shop and the blog. A description helps shoppers using a screen reader, and helps Google."
      />
      <MediaLibrary
        items={media.map((m) => ({
          id: m.id,
          secureUrl: m.secureUrl,
          altText: m.altText,
          width: m.width,
          height: m.height,
          bytes: m.bytes,
          format: m.format,
          usageCount:
            m._count.productImages + m._count.categories + m._count.postCovers,
        }))}
      />
    </>
  );
}
