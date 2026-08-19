/**
 * Media URL helpers (Step 7 - image optimization).
 *
 * Avatars and small previews request a downscaled version of
 * Supabase Storage images via the storage image-transformation
 * query params. When transformations are disabled on the project,
 * the extra params are ignored and the original image is served,
 * so this is always safe.
 */

const STORAGE_URL_RE = /\/storage\/v1\/object\/public\//;

export function isSupabaseStorageUrl(url: string | null | undefined): url is string {
  return Boolean(url && STORAGE_URL_RE.test(url));
}

/**
 * Returns a Supabase storage URL capped at roughly `width` px
 * (2x for retina screens). Non-storage URLs pass through untouched.
 */
export function thumbnailUrl(url: string | null | undefined, width: number): string | null {
  if (!url) {
    return null;
  }
  if (!isSupabaseStorageUrl(url)) {
    return url;
  }
  const size = Math.max(32, Math.round(width * 2));
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${size}&height=${size}&resize=cover&quality=80`;
}