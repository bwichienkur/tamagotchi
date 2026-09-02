import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const upload = await prisma.userUpload.findUnique({
    where: { id },
  });

  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(upload.data), {
    headers: {
      "Content-Type": upload.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
