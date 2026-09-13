import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { fail, handleError, ok, paginated, parsePagination } from "@/lib/api";
import { uploadBuffer } from "@/lib/cloudinary";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const { page, perPage, skip, take } = parsePagination(req.nextUrl.searchParams);
    const [items, total] = await Promise.all([
      prisma.media.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
      prisma.media.count(),
    ]);
    return paginated(items, { page, perPage, total });
  } catch (error) {
    return handleError(error);
  }
}

/** multipart/form-data: files[] plus optional `folder` and `altText`. */
export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;

  try {
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) return fail("No files uploaded", 422);

    const subfolder = (form.get("folder") as string) || "uploads";
    const altText = (form.get("altText") as string) || null;

    const created = [];
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        return fail(`Unsupported file type: ${file.type}`, 415);
      }
      if (file.size > MAX_BYTES) {
        return fail(`${file.name} exceeds the 8MB limit`, 413);
      }

      const result = await uploadBuffer(
        Buffer.from(await file.arrayBuffer()),
        subfolder,
      );
      created.push(
        await prisma.media.create({
          data: {
            publicId: result.publicId,
            url: result.url,
            secureUrl: result.secureUrl,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            folder: result.folder,
            altText,
          },
        }),
      );
    }

    return ok(created, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
