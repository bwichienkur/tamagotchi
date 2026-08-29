"use client";

/**
 * Upload an image via the best available method:
 * - Vercel Blob client upload when configured (large files, direct to CDN)
 * - Server form upload with database fallback when Blob is not set up
 */
export async function uploadImage(file: File): Promise<string> {
  let preferClientBlob = true;

  try {
    const configRes = await fetch("/api/upload", { credentials: "include" });
    if (configRes.ok) {
      const config = await configRes.json();
      preferClientBlob = Boolean(config.blob);
    }
  } catch {
    preferClientBlob = false;
  }

  if (preferClientBlob) {
    try {
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      return blob.url;
    } catch (error) {
      console.warn("Blob client upload failed, falling back to server upload:", error);
    }
  }

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

  return data.url;
}
