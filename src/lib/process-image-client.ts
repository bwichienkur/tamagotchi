"use client";

import { isHeicBuffer, isHeicFileMeta } from "@/lib/heic";

/** Stay under Vercel's ~4.5MB serverless request body limit. */
export const UPLOAD_TARGET_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 2400;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image file."));
    img.src = url;
  });
}

function canvasToJpeg(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image."))),
      "image/jpeg",
      quality
    );
  });
}

async function fileLooksLikeHeic(file: File): Promise<boolean> {
  if (isHeicFileMeta(file.name, file.type)) return true;
  const header = await file.slice(0, 12).arrayBuffer();
  return isHeicBuffer(header);
}

/** Safari/iOS can decode HEIC natively — prefer canvas over heic2any. */
async function convertHeicViaCanvas(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const blob = await canvasToJpeg(img, img.naturalWidth, img.naturalHeight, 0.92);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertHeicViaHeic2any(file: File): Promise<File | null> {
  try {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  }
}

async function decodeToJpegFile(file: File): Promise<File> {
  if (await fileLooksLikeHeic(file)) {
    const viaCanvas = await convertHeicViaCanvas(file);
    if (viaCanvas) return viaCanvas;

    const viaHeic2any = await convertHeicViaHeic2any(file);
    if (viaHeic2any) return viaHeic2any;
  }

  if (file.type === "image/jpeg" || file.type === "image/jpg" || /\.jpe?g$/i.test(file.name)) {
    return file;
  }

  // Decode any browser-supported format (PNG, WebP, GIF, HEIC on Safari) to JPEG.
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const blob = await canvasToJpeg(img, img.naturalWidth, img.naturalHeight, 0.92);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressToLimit(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let quality = 0.9;

    while (quality >= 0.4) {
      for (let scale = 1; scale >= 0.35; scale -= 0.1) {
        let width = Math.max(1, Math.round(img.naturalWidth * scale));
        let height = Math.max(1, Math.round(img.naturalHeight * scale));

        const maxSide = Math.max(width, height);
        if (maxSide > MAX_DIMENSION) {
          const ratio = MAX_DIMENSION / maxSide;
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const blob = await canvasToJpeg(img, width, height, quality);
        if (blob.size <= maxBytes) {
          return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg") || "photo.jpg", {
            type: "image/jpeg",
          });
        }
      }
      quality -= 0.1;
    }

    // Last resort: smaller dimensions
    const width = Math.min(img.naturalWidth, 1600);
    const height = Math.round((img.naturalHeight / img.naturalWidth) * width);
    const blob = await canvasToJpeg(img, width, height, 0.75);
    if (blob.size <= maxBytes) {
      return new File([blob], "photo.jpg", { type: "image/jpeg" });
    }

    throw new Error("Image is too large. Try a smaller photo.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Normalize iPhone/other photos to a JPEG under the upload size limit. */
export async function processImageForUpload(file: File): Promise<File> {
  const decoded = await decodeToJpegFile(file);
  return compressToLimit(decoded, UPLOAD_TARGET_BYTES);
}
