import "@/lib/bootstrap-env";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { hasBlobStorage, saveUploadedImage } from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let storageReady = false;
  try {
    await prisma.$queryRaw`SELECT 1 FROM "UserUpload" LIMIT 1`;
    storageReady = true;
  } catch {
    storageReady = false;
  }

  return NextResponse.json({
    blob: hasBlobStorage(),
    storageReady,
    modes: process.env.VERCEL
      ? ["blob-server", "database"]
      : hasBlobStorage()
        ? ["blob-server", "database", "local"]
        : ["database", "local"],
  });
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json(
      { error: "Please sign in to upload images." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const url = await saveUploadedImage(file, session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload failed:", error);

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("body exceeded") || message.includes("too large")) {
        return NextResponse.json(
          { error: "Image is too large. The app compresses photos automatically — please try again." },
          { status: 413 }
        );
      }

      if (message.includes("foreign key") || message.includes("userupload_userid_fkey")) {
        return NextResponse.json(
          { error: "Your account could not be verified. Please sign out and sign in again." },
          { status: 401 }
        );
      }
    }

    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
