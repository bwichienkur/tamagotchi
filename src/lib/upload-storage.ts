import "@/lib/bootstrap-env";
import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const STORAGE_PREFIX = "tamagotchi_";
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

function env(name: string): string | undefined {
  return process.env[`${STORAGE_PREFIX}${name}`] ?? process.env[name];
}

export function getBlobReadWriteToken(): string | undefined {
  return env("BLOB_READ_WRITE_TOKEN");
}

export function hasBlobStorage(): boolean {
  return Boolean(getBlobReadWriteToken());
}

export function resolveImageMimeType(file: File): string | null {
  const normalizedType = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (normalizedType && normalizedType !== "application/octet-stream") {
    if (ALLOWED_MIME_TYPES.has(normalizedType)) return normalizedType;
  }

  const ext = path.extname(file.name).toLowerCase();
  return EXTENSION_MIME[ext] ?? null;
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

export async function saveUploadedImage(file: File, userId: string): Promise<string> {
  const mimeType = resolveImageMimeType(file);
  if (!mimeType) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are supported.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const filename = `${randomBytes(16).toString("hex")}${extensionFor(file, mimeType)}`;
  const token = getBlobReadWriteToken();

  if (token) {
    const blob = await put(`uploads/${filename}`, buffer, {
      access: "public",
      token,
      contentType: mimeType,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    if (buffer.length > DB_FALLBACK_MAX_BYTES) {
      throw new Error("Image must be 5 MB or smaller without Vercel Blob storage.");
    }

    const upload = await prisma.userUpload.create({
      data: {
        userId,
        filename,
        mimeType,
        data: buffer,
      },
    });

    return `/api/uploads/${upload.id}`;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}

export async function handleBlobClientUpload(
  request: Request,
  body: HandleUploadBody,
  userId: string
) {
  const token = getBlobReadWriteToken();
  if (!token) {
    throw new Error(
      "Client uploads require Vercel Blob. Use the standard upload endpoint instead."
    );
  }

  return handleUpload({
    token,
    request,
    body,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [...ALLOWED_MIME_TYPES],
      maximumSizeInBytes: MAX_BYTES,
      tokenPayload: userId,
    }),
  });
}
