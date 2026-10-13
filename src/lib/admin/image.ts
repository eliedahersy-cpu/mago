/** Rules for product images uploaded from the admin (checked in the browser before uploading). */

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

/** Why a file cannot be used, or null when it can. */
export function imageProblem(file: { type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Use a JPEG, PNG, WebP or AVIF image.';
  if (file.size <= 0) return 'That file is empty.';
  if (file.size > MAX_IMAGE_BYTES) return 'Images must be 5 MB or smaller.';
  return null;
}

/** Storage path inside the product-images bucket: <product id>/<uuid>.<ext>. */
export function imagePath(productId: string, id: string, type: string): string {
  return `${productId}/${id}.${EXT[type] ?? 'jpg'}`;
}
