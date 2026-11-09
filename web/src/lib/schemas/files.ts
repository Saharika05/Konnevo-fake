export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_MB = 5;

/** Photos, project images and posters: jpg, png or webp, up to 5 MB. Returns a message, or null when fine. */
export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Use a JPG, PNG or WebP image.";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Each image must be under ${MAX_IMAGE_MB} MB.`;
  return null;
}
