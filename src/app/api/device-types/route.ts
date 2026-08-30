import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { resolveFamilyIdForCreate } from "@/lib/device-family";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

const createDeviceTypeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  familyId: z.string().optional(),
  generation: z.string().trim().max(120).optional().nullable(),
});

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deviceTypes = await prisma.deviceModel.findMany({
    include: {
      family: { select: { id: true, name: true } },
      _count: {
        select: {
          ownedDevices: true,
          shells: true,
          wikiPages: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(deviceTypes);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createDeviceTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const name = parsed.data.name;
  const slug = createSlug(name);

  const existing = await prisma.deviceModel.findFirst({
    where: {
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
    include: {
      family: { select: { id: true, name: true } },
      _count: {
        select: {
          ownedDevices: true,
          shells: true,
          wikiPages: true,
        },
      },
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const created = await prisma.deviceModel.create({
    data: {
      name,
      slug,
      familyId: await resolveFamilyIdForCreate(parsed.data.familyId),
      generation: parsed.data.generation || null,
    },
    include: {
      family: { select: { id: true, name: true } },
      _count: {
        select: {
          ownedDevices: true,
          shells: true,
          wikiPages: true,
        },
      },
    },
  });

  revalidateDeviceCatalog();

  return NextResponse.json(created, { status: 201 });
}
