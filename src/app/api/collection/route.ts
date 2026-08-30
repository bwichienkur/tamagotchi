import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug, createUniqueSlug } from "@/lib/slug";
import { ensurePhotoFramesColumn } from "@/lib/ensure-photo-frames";
import { z } from "zod";

const createOwnedDeviceSchema = z.object({
  deviceModelId: z.string().optional(),
  newDeviceModelName: z.string().optional(),
  shellId: z.string().optional(),
  newShellName: z.string().optional(),
  nickname: z.string().optional(),
  primaryPhoto: z.string().optional(),
  additionalPhotos: z.array(z.string()).optional(),
  photoFrames: z
    .object({
      primary: z
        .object({
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100),
          zoom: z.number().min(1).max(3),
        })
        .optional(),
      additional: z
        .record(
          z.string(),
          z.object({
            x: z.number().min(0).max(100),
            y: z.number().min(0).max(100),
            zoom: z.number().min(1).max(3),
          })
        )
        .optional(),
    })
    .optional(),
  conditionBadge: z.enum(["NONE", "NIB", "IOB"]).default("NONE"),
  showMoreInfo: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  purchaseCurrency: z.string().optional(),
  purchasedFrom: z.string().optional(),
  serialNumber: z.string().optional(),
  workingStatus: z.enum(["WORKING", "NOT_WORKING", "UNTESTED", "FOR_PARTS"]).optional(),
  currentlyRunning: z.boolean().optional(),
  favorite: z.boolean().optional(),
  notes: z.string().optional(),
});

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
  const body = await request.json();
  const data = createOwnedDeviceSchema.parse(body);

  let deviceModelId = data.deviceModelId;

  if (data.newDeviceModelName) {
    const slug = createSlug(data.newDeviceModelName);
    const existing = await prisma.deviceModel.findUnique({ where: { slug } });
    if (existing) {
      deviceModelId = existing.id;
    } else {
      const modernFamily = await prisma.deviceFamily.findFirst({
        where: { slug: "modern" },
      });
      const familyId =
        modernFamily?.id ??
        (await prisma.deviceFamily.create({
          data: { name: "Other", slug: "other", sortOrder: 99 },
        })).id;

      const created = await prisma.deviceModel.create({
        data: {
          name: data.newDeviceModelName,
          slug,
          familyId,
        },
      });
      deviceModelId = created.id;
    }
  }

  if (!deviceModelId) {
    return NextResponse.json({ error: "Device model required" }, { status: 400 });
  }

  let shellId = data.shellId;

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
      photoFrames: data.photoFrames as Prisma.InputJsonValue | undefined,
      conditionBadge: data.conditionBadge,
      showMoreInfo: data.showMoreInfo,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchasePrice: data.purchasePrice,
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
