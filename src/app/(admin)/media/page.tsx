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
      <PageHeader title="Media" subtitle="Images stored in Cloudinary" />
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
