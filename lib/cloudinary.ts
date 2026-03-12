/**
 * Cloudinary Integration
 * ──────────────────────
 * Strategy: Signed uploads via server-generated signatures.
 *  1. Client requests a signed upload signature from /api/upload/sign
 *  2. Client uploads directly to Cloudinary using the signature
 *  3. Cloudinary URL is saved in the database
 *
 * Images are organized in a folder structure:
 *   galerie/{listingId}/{timestamp}
 */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// ── Upload signature ──────────────────────────────────────────

export interface UploadSignatureParams {
  listingId?: string;
  uploadPreset?: string;
  eager?: string;
}

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  eager: string;
  uploadPreset?: string;
}

/**
 * Generate a signed upload signature for direct browser → Cloudinary uploads.
 * Signature prevents unauthorized uploads to the account.
 */
export function generateUploadSignature(
  params: UploadSignatureParams
): SignedUploadParams {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `galerie/${params.listingId || "drafts"}`;

  // Transformations: create thumbnail + webp versions automatically
  const eager =
    "w_400,h_400,c_limit,f_webp,q_auto|w_1200,h_1200,c_limit,f_webp,q_auto:best";

  const signatureParams: Record<string, string | number> = {
    timestamp,
    folder,
    eager,
  };

  if (params.uploadPreset) {
    signatureParams.upload_preset = params.uploadPreset;
  }

  const signature = cloudinary.utils.api_sign_request(
    signatureParams,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    eager,
  };
}

// ── Image transformation helpers ──────────────────────────────

export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: "auto" | "auto:best" | "auto:good" | number;
    format?: "webp" | "auto" | "jpg";
    crop?: "fill" | "limit" | "thumb" | "fit";
  } = {}
): string {
  const {
    width,
    height,
    quality = "auto",
    format = "webp",
    crop = "limit",
  } = options;

  const transformations: Record<string, string | number> = {
    fetch_format: format,
    quality,
    crop,
  };

  if (width) transformations.width = width;
  if (height) transformations.height = height;

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [transformations],
  });
}

export function getThumbnailUrl(publicId: string): string {
  return getOptimizedUrl(publicId, {
    width: 400,
    height: 400,
    crop: "fill",
    quality: "auto",
    format: "webp",
  });
}

export function getFullSizeUrl(publicId: string): string {
  return getOptimizedUrl(publicId, {
    width: 1400,
    crop: "limit",
    quality: "auto:best",
    format: "webp",
  });
}

// ── Deletion ──────────────────────────────────────────────────

/**
 * Delete an image from Cloudinary by its public_id.
 * Called when admin removes or replaces an image.
 */
export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Delete all images in a listing's folder.
 */
export async function deleteListingImages(listingId: string): Promise<void> {
  await cloudinary.api.delete_resources_by_prefix(`galerie/${listingId}/`);
}
