import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const STORAGE_PREFIX = "tamagotchi_";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024;

function env(name: string): string | undefined {
  return process.env[`${STORAGE_PREFIX}${name}`] ?? process.env[name];
}

export function getBlobReadWriteToken(): string | undefined {
  return env("BLOB_READ_WRITE_TOKEN");
}

export function hasBlobStorage(): boolean {
  return Boolean(getBlobReadWriteToken());
}

function extensionFor(file: File): string {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName && [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(fromName)) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are supported.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const filename = `${randomBytes(16).toString("hex")}${extensionFor(file)}`;
  const token = getBlobReadWriteToken();

  if (token) {
    const blob = await put(`uploads/${filename}`, buffer, {
      access: "public",
      token,
      contentType: file.type,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Image uploads require Vercel Blob storage. Add a Blob store to this project in Vercel."
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}
