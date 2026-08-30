import "@/lib/bootstrap-env";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getBlobReadWriteToken, hasBlobStorage } from "@/lib/blob-env";

export { getBlobReadWriteToken, hasBlobStorage };

const MAX_BYTES = 10 * 1024 * 1024;
const DB_FALLBACK_MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const ALLOWED_MIME_TYPES = new Set(Object.values(EXTENSION_MIME));

function sniffMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    buffer.length >= 6 &&
    (buffer.toString("ascii", 0, 6) === "GIF87a" || buffer.toString("ascii", 0, 6) === "GIF89a")
  ) {
    return "image/gif";
  }
  return null;
}

export function resolveImageMimeType(file: File, buffer?: Buffer): string | null {
  const normalizedType = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (normalizedType && normalizedType !== "application/octet-stream") {
    if (ALLOWED_MIME_TYPES.has(normalizedType)) return normalizedType;
  }

  const ext = path.extname(file.name).toLowerCase();
  if (EXTENSION_MIME[ext]) return EXTENSION_MIME[ext];

  if (buffer) {
    return sniffMimeFromBuffer(buffer);
  }

  return null;
}

function extensionFor(file: File, mimeType: string): string {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName && Object.keys(EXTENSION_MIME).includes(fromName)) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }

  switch (mimeType) {
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

async function saveToDatabase(
  buffer: Buffer,
  userId: string,
  filename: string,
  mimeType: string
): Promise<string> {
  if (buffer.length > DB_FALLBACK_MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const upload = await prisma.userUpload.create({
    data: {
      userId,
      filename,
      mimeType,
      data: new Uint8Array(buffer),
    },
  });

  return `/api/uploads/${upload.id}`;
}

async function saveToBlob(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  getBlobReadWriteToken();
  const blob = await put(`uploads/${filename}`, buffer, {
    access: "public",
    contentType: mimeType,
  });
  return blob.url;
}

export async function saveUploadedImage(file: File, userId: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer.length === 0) {
    throw new Error("The selected file is empty.");
  }

  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const mimeType = resolveImageMimeType(file, buffer);
  if (!mimeType) {
    throw new Error(
      "Unsupported image format. Please use JPEG, PNG, WebP, or GIF (HEIC is not supported)."
    );
  }

  const filename = `${randomBytes(16).toString("hex")}${extensionFor(file, mimeType)}`;

  if (hasBlobStorage()) {
    try {
      return await saveToBlob(buffer, filename, mimeType);
    } catch (error) {
      console.error("Blob upload failed, falling back to database:", error);
      if (!process.env.VERCEL) {
        throw error instanceof Error ? error : new Error("Blob upload failed.");
      }
    }
  }

  if (process.env.VERCEL) {
    return saveToDatabase(buffer, userId, filename, mimeType);
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}
