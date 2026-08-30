import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { ownedDeviceInputSchema } from "@/lib/owned-device-schema";
import {
  resolveDeviceModelId,
  resolveShellId,
} from "@/lib/resolve-owned-device-relations";

export async function PATCH(
  request: NextRequest,
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

  const body = await request.json();
  const parsed = ownedDeviceInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  let deviceModelId = device.deviceModelId;
  if (data.deviceModelId !== undefined || data.newDeviceModelName) {
    const resolved = await resolveDeviceModelId({
      deviceModelId: data.deviceModelId ?? device.deviceModelId,
      newDeviceModelName: data.newDeviceModelName,
    });
    if (!resolved) {
      return NextResponse.json({ error: "Device model required" }, { status: 400 });
    }
    deviceModelId = resolved;
  }

  let shellId: string | null | undefined;
  let customShellName: string | null | undefined;
  if (data.shellId !== undefined || data.newShellName !== undefined) {
    const resolvedShell = await resolveShellId(deviceModelId, {
      shellId: data.shellId,
      newShellName: data.newShellName,
    });
    if (resolvedShell !== undefined) {
      shellId = resolvedShell;
      customShellName = resolvedShell ? null : data.newShellName ?? null;
    }
  }

  const updated = await prisma.ownedDevice.update({
    where: { id: device.id },
    data: {
      ...(deviceModelId !== device.deviceModelId && { deviceModelId }),
      ...(shellId !== undefined && { shellId }),
      ...(customShellName !== undefined && { customShellName }),
      ...(data.nickname !== undefined && { nickname: data.nickname }),
      ...(data.primaryPhoto !== undefined && { primaryPhoto: data.primaryPhoto }),
      ...(data.additionalPhotos !== undefined && {
        additionalPhotos: data.additionalPhotos,
      }),
      ...(data.photoFrames !== undefined && {
        photoFrames: data.photoFrames as Prisma.InputJsonValue,
      }),
      ...(data.conditionBadge !== undefined && { conditionBadge: data.conditionBadge }),
      ...(data.conditionNotes !== undefined && { conditionNotes: data.conditionNotes }),
      ...(data.showMoreInfo !== undefined && { showMoreInfo: data.showMoreInfo }),
      ...(data.purchaseDate !== undefined && {
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      }),
      ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
      ...(data.purchaseCurrency !== undefined && {
        purchaseCurrency: data.purchaseCurrency ?? "USD",
      }),
      ...(data.purchasedFrom !== undefined && { purchasedFrom: data.purchasedFrom }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
      ...(data.workingStatus !== undefined && { workingStatus: data.workingStatus }),
      ...(data.currentlyRunning !== undefined && {
        currentlyRunning: data.currentlyRunning,
      }),
      ...(data.favorite !== undefined && { favorite: data.favorite }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      deviceModel: true,
      shell: true,
    },
  });

  return NextResponse.json(updated);
}

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
