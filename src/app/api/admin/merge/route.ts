import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const fromId = request.nextUrl.searchParams.get("fromId");
  if (!fromId) {
    return NextResponse.json({ error: "fromId required" }, { status: 400 });
  }

  const [shells, wikiPages, ownedDevices] = await Promise.all([
    prisma.shell.count({ where: { deviceModelId: fromId } }),
    prisma.wikiPage.count({ where: { deviceModelId: fromId } }),
    prisma.ownedDevice.count({ where: { deviceModelId: fromId } }),
  ]);

  return NextResponse.json({ shells, wikiPages, ownedDevices });
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const { fromId, toId } = await request.json();

  if (!fromId || !toId || fromId === toId) {
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
  }

  const fromDevice = await prisma.deviceModel.findUnique({
    where: { id: fromId },
    include: { _count: { select: { shells: true, ownedDevices: true, wikiPages: true } } },
  });

  if (!fromDevice) {
    return NextResponse.json({ error: "Source device not found" }, { status: 404 });
  }

  const toDevice = await prisma.deviceModel.findUnique({ where: { id: toId } });
  if (!toDevice) {
    return NextResponse.json({ error: "Target device not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.shell.updateMany({ where: { deviceModelId: fromId }, data: { deviceModelId: toId } }),
    prisma.ownedDevice.updateMany({ where: { deviceModelId: fromId }, data: { deviceModelId: toId } }),
    prisma.wikiPage.updateMany({ where: { deviceModelId: fromId }, data: { deviceModelId: toId } }),
    prisma.deviceProperty.updateMany({ where: { deviceModelId: fromId }, data: { deviceModelId: toId } }),
    prisma.galleryImage.updateMany({ where: { deviceModelId: fromId }, data: { deviceModelId: toId } }),
  ]);

  try {
    await prisma.deviceModel.delete({ where: { id: fromId } });
  } catch {
    return NextResponse.json(
      { error: "Could not delete source device — check for remaining dependencies" },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
