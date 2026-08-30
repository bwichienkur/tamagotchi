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
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
