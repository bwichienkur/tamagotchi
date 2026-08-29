import "@/lib/bootstrap-env";
import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/session";
import {
  handleBlobClientUpload,
  hasBlobStorage,
  saveUploadedImage,
} from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    blob: hasBlobStorage(),
    modes: hasBlobStorage()
      ? ["blob-client", "blob-server", "database"]
      : ["database", "local"],
  });
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const result = await handleBlobClientUpload(request, body, session.user.id);
      return NextResponse.json(result);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const url = await saveUploadedImage(file, session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
