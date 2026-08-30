"use client";

import { isHeicBuffer, isHeicFileMeta } from "@/lib/heic";

async function fileLooksLikeHeic(file: File): Promise<boolean> {
  if (isHeicFileMeta(file.name, file.type)) return true;

  const header = await file.slice(0, 12).arrayBuffer();
  return isHeicBuffer(header);
}

/** Convert iPhone HEIC/HEIF photos to JPEG before upload. */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!(await fileLooksLikeHeic(file))) {
    return file;
  }

  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";

  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
