import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug, createUniqueSlug } from "@/lib/slug";
import { ensurePhotoFramesColumn } from "@/lib/ensure-photo-frames";
import { resolveDeviceModelId } from "@/lib/resolve-owned-device-relations";
import { createOwnedDeviceInputSchema } from "@/lib/owned-device-schema";
import { z } from "zod";

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devices = await prisma.ownedDevice.findMany({
    where: { userId: session.user.id },
    include: {
      deviceModel: { include: { family: true } },
      shell: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(devices);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let data: z.infer<typeof createOwnedDeviceInputSchema>;
  try {
    data = createOwnedDeviceInputSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    throw error;
  }

  let deviceModelId = data.deviceModelId;
  let shellId = data.shellId;

  if (shellId && !deviceModelId && !data.newDeviceModelName) {
    const shellForModel = await prisma.shell.findUnique({
      where: { id: shellId },
      select: { deviceModelId: true },
    });
    if (!shellForModel) {
      return NextResponse.json({ error: "Shell not found" }, { status: 400 });
    }
    deviceModelId = shellForModel.deviceModelId;
  }

  if (data.newDeviceModelName) {
    const resolved = await resolveDeviceModelId({
      newDeviceModelName: data.newDeviceModelName,
      familyId: data.familyId,
    });
    if (resolved) {
      deviceModelId = resolved;
    }
  }

  if (!deviceModelId) {
    return NextResponse.json({ error: "Device model required" }, { status: 400 });
  }

  if (shellId) {
    const shellRecord = await prisma.shell.findUnique({
      where: { id: shellId },
      select: { deviceModelId: true },
    });
    if (!shellRecord) {
      return NextResponse.json({ error: "Shell not found" }, { status: 400 });
    }
    if (shellRecord.deviceModelId !== deviceModelId) {
      return NextResponse.json(
        { error: "Shell does not match the selected device type" },
        { status: 400 }
      );
    }
  }

  if (data.newShellName && deviceModelId) {
    const shellSlug = createSlug(data.newShellName);
    const existingShell = await prisma.shell.findUnique({
      where: { deviceModelId_slug: { deviceModelId, slug: shellSlug } },
    });
    if (existingShell) {
      shellId = existingShell.id;
    } else {
      const createdShell = await prisma.shell.create({
        data: {
          deviceModelId,
          name: data.newShellName,
          slug: shellSlug,
        },
      });
      shellId = createdShell.id;
    }
  }

  const deviceModel = await prisma.deviceModel.findUnique({
    where: { id: deviceModelId },
  });
  const shell = shellId
    ? await prisma.shell.findUnique({ where: { id: shellId } })
    : null;

  const slugBase = shell?.name ?? data.newShellName ?? deviceModel?.name ?? "device";
  const slug = createUniqueSlug(`${slugBase}-${deviceModel?.name ?? "tamagotchi"}`);

  await ensurePhotoFramesColumn();

  const owned = await prisma.ownedDevice.create({
    data: {
      userId: session.user.id,
      deviceModelId,
      shellId,
      customShellName: !shellId ? data.newShellName : undefined,
      slug,
      nickname: data.nickname,
      primaryPhoto: data.primaryPhoto,
      additionalPhotos: data.additionalPhotos ?? [],
      photoFrames: data.photoFrames ?? undefined,
      conditionBadge: data.conditionBadge,
      showMoreInfo: data.showMoreInfo,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchasePrice: data.purchasePrice,
      estimatedValue: data.estimatedValue ?? undefined,
      purchaseCurrency: data.purchaseCurrency ?? "USD",
      purchasedFrom: data.purchasedFrom,
      serialNumber: data.serialNumber,
      workingStatus: data.workingStatus ?? "UNTESTED",
      currentlyRunning: data.currentlyRunning ?? false,
      favorite: data.favorite ?? false,
      notes: data.notes,
    },
    include: {
      deviceModel: true,
      shell: true,
    },
  });

  return NextResponse.json(owned, { status: 201 });
}
