import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";

const createShellSchema = z.object({
  deviceModelId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceModelId = searchParams.get("deviceModelId");
  const q = searchParams.get("q") ?? "";

  const shells = await prisma.shell.findMany({
    where: {
      ...(deviceModelId ? { deviceModelId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { alternateNames: { hasSome: [q] } },
            ],
          }
        : {}),
    },
    include: {
      deviceModel: { include: { family: true } },
      _count: { select: { ownedDevices: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(shells);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createShellSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { deviceModelId, name } = parsed.data;
  const slug = createSlug(name);

  const deviceModel = await prisma.deviceModel.findUnique({
    where: { id: deviceModelId },
  });
  if (!deviceModel) {
    return NextResponse.json({ error: "Device type not found" }, { status: 404 });
  }

  const existing = await prisma.shell.findFirst({
    where: {
      deviceModelId,
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
    include: {
      deviceModel: { select: { id: true, name: true } },
      _count: { select: { ownedDevices: true, wishlistItems: true } },
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const created = await prisma.shell.create({
    data: {
      deviceModelId,
      name,
      slug,
    },
    include: {
      deviceModel: { select: { id: true, name: true } },
      _count: { select: { ownedDevices: true, wishlistItems: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
