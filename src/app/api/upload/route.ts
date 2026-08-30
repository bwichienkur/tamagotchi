import "@/lib/bootstrap-env";
import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/session";
import { hasBlobStorage, saveUploadedImage } from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    blob: hasBlobStorage(),
    modes: hasBlobStorage()
      ? ["blob-server", "database"]
      : ["database", "local"],
  });
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

      if (
        message.includes("upload storage") ||
        message.includes("userupload") ||
        message.includes("does not exist")
      ) {
        return NextResponse.json(
          { error: "Upload is temporarily unavailable. Please wait a moment and try again." },
          { status: 503 }
        );
      }
    }

    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
