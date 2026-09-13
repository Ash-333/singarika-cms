import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "singarika";

export type UploadResult = {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  folder: string;
};

/** Uploads a file buffer to Cloudinary under `<root folder>/<subfolder>`. */
export function uploadBuffer(
  buffer: Buffer,
  subfolder = "uploads",
): Promise<UploadResult> {
  const folder = `${CLOUDINARY_FOLDER}/${subfolder}`;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          folder,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function destroyAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

/**
 * Builds a transformed delivery URL. Storefronts should call this rather than
 * using the raw secure_url so images are resized/compressed at the CDN.
 */
export function cdnUrl(
  publicId: string,
  opts: { width?: number; height?: number; crop?: string } = {},
) {
  const { width, height, crop = "fill" } = opts;
  const parts = ["f_auto", "q_auto"];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${crop}`);
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${parts.join(",")}/${publicId}`;
}

export { cloudinary };
