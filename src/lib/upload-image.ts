"use client";

import { processImageForUpload } from "@/lib/process-image-client";

async function parseUploadError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { error?: string };
    if (typeof data.error === "string" && data.error) return data.error;
  } catch {
    // not JSON
  }

  if (res.status === 413) {
    return "Image is too large for upload. Try a smaller photo.";
  }

  if (res.status >= 500) {
    return "Server error during upload. Please try again.";
  }

  return text ? text.slice(0, 200) : "Upload failed";
}

/**
 * Upload an image via the server upload endpoint.
 * Images are converted to JPEG and compressed for Vercel size limits.
 */
export async function uploadImage(file: File): Promise<string> {
  let prepared: File;
  try {
    prepared = await processImageForUpload(file);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Could not process image for upload."
    );
  }

  const formData = new FormData();
  formData.append("file", prepared);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (res.status === 401) {
    throw new Error("Please sign in to upload images.");
  }

  if (!res.ok) {
    throw new Error(await parseUploadError(res));
  }

  let data: { url?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error("Upload failed — invalid server response.");
  }

  if (typeof data.url !== "string" || !data.url) {
    throw new Error("Upload succeeded but no image URL was returned.");
  }

  return data.url;
}
