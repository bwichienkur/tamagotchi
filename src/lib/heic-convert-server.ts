import { isHeicBuffer, isHeicFileMeta } from "@/lib/heic";

function shouldConvertHeic(buffer: Buffer, file: File): boolean {
  return isHeicFileMeta(file.name, file.type) || isHeicBuffer(buffer);
}

/** Convert HEIC/HEIF buffer to JPEG for storage and browser display. */
export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const { default: convert } = await import("heic-convert");
  const output = await convert({
    buffer,
    format: "JPEG",
    quality: 0.92,
  });

  return Buffer.from(output);
}

export async function normalizeUploadedImageBuffer(
  file: File,
  buffer: Buffer
): Promise<{ buffer: Buffer; mimeType: "image/jpeg" } | null> {
  if (!shouldConvertHeic(buffer, file)) {
    return null;
  }

  try {
    const jpegBuffer = await convertHeicToJpeg(buffer);
    return { buffer: Buffer.from(jpegBuffer), mimeType: "image/jpeg" };
  } catch (error) {
    console.error("Server HEIC conversion failed:", error);
    return null;
  }
}
