/**
 * Upload validation for images.
 *
 * Only raster formats are allowed. SVG is a script-capable XML format: an
 * uploaded `<svg><script>…</script></svg>` served from the API origin is a
 * stored-XSS vector, so it is rejected even when the client claims an
 * `image/svg+xml` MIME type. Detection is done on the file's magic bytes
 * (never the client-supplied filename or MIME type), and the extension used
 * for local storage is derived from the detected format.
 */

export const RASTER_IMAGE_FORMATS = ["png", "jpeg", "gif", "webp", "avif"] as const;
export type RasterImageFormat = (typeof RASTER_IMAGE_FORMATS)[number];

/** MIME types allowed through Multer's file filter (the authoritative check is magic bytes). */
export const RASTER_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
]);

/** Raster-only allow-list used when listing / deleting locally stored uploads. */
export const RASTER_EXTENSION_PATTERN = /\.(png|jpe?g|gif|webp|avif)$/i;

const EXTENSION_BY_FORMAT: Record<RasterImageFormat, string> = {
  png: ".png",
  jpeg: ".jpg",
  gif: ".gif",
  webp: ".webp",
  avif: ".avif",
};

/** Returns the raster format for a buffer, or null when the magic bytes don't match. */
export function detectRasterImageFormat(buffer: Buffer): RasterImageFormat | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // GIF: "GIF87a" / "GIF89a"
  const ascii = buffer.subarray(0, 8).toString("ascii");
  if (ascii === "GIF87a" || ascii === "GIF89a") {
    return "gif";
  }

  // WebP: "RIFF" + four bytes + "WEBP"
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }

  // AVIF: ISO-BMFF with an "avif"/"avis" brand in the ftyp box.
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") return "avif";
  }

  return null;
}

/** Canonical file extension for a detected raster format. */
export function rasterExtension(format: RasterImageFormat): string {
  return EXTENSION_BY_FORMAT[format];
}
