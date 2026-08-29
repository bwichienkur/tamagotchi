import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const device = await prisma.ownedDevice.findFirst({
    where: { slug, userId: session.user.id },
  });

  if (!device) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.ownedDevice.delete({ where: { id: device.id } });

  return NextResponse.json({ ok: true });
}
