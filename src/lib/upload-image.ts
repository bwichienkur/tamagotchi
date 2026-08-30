"use client";

/**
 * Upload an image via the server upload endpoint.
 * Server handles Vercel Blob (when configured) with database fallback.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    throw new Error("Please sign in to upload images.");
  }

  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed");
  }

  if (typeof data.url !== "string" || !data.url) {
    throw new Error("Upload succeeded but no image URL was returned.");
  }

  return data.url;
}
