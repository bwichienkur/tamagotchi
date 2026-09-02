import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

const devicePropertySchema = z.object({
  id: z.string().optional(),
  group: z.string().trim().min(1),
  label: z.string().trim().min(1),
  value: z.string(),
  sortOrder: z.number().int().optional(),
});

const updateDeviceTypeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  familyId: z.string().optional(),
  heroImage: z.string().nullable().optional(),
  manufacturer: z.string().trim().max(120).nullable().optional(),
  releaseYear: z.number().int().min(1970).max(2100).nullable().optional(),
  regions: z.array(z.string().trim().min(1)).optional(),
  properties: z.array(devicePropertySchema).optional(),
});

const deviceTypeInclude = {
  family: { select: { id: true, name: true } },
  _count: {
    select: {
      ownedDevices: true,
      shells: true,
      wikiPages: true,
    },
  },
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateDeviceTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.deviceModel.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Device type not found" }, { status: 404 });
  }

  const name = parsed.data.name ?? existing.name;
  const slug = createSlug(name);
  const familyId = parsed.data.familyId ?? existing.familyId;

  const conflict = await prisma.deviceModel.findFirst({
    where: {
      id: { not: id },
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: `A device type named "${conflict.name}" already exists.` },
      { status: 409 }
    );
  }

  const updated = await prisma.deviceModel.update({
    where: { id },
    data: {
      name,
      slug,
      ...(parsed.data.familyId !== undefined && { familyId }),
      ...(parsed.data.heroImage !== undefined && { heroImage: parsed.data.heroImage }),
      ...(parsed.data.manufacturer !== undefined && { manufacturer: parsed.data.manufacturer }),
      ...(parsed.data.releaseYear !== undefined && { releaseYear: parsed.data.releaseYear }),
      ...(parsed.data.regions !== undefined && { regions: parsed.data.regions }),
    },
    include: deviceTypeInclude,
  });

  if (parsed.data.properties !== undefined) {
    await prisma.$transaction([
      prisma.deviceProperty.deleteMany({ where: { deviceModelId: id } }),
      ...(parsed.data.properties.length > 0
        ? [
            prisma.deviceProperty.createMany({
              data: parsed.data.properties.map((property, index) => ({
                deviceModelId: id,
                group: property.group,
                label: property.label,
                value: property.value,
                sortOrder: property.sortOrder ?? index,
              })),
            }),
          ]
        : []),
    ]);
  }

  const withProperties = await prisma.deviceModel.findUnique({
    where: { id },
    include: {
      ...deviceTypeInclude,
      properties: { orderBy: { sortOrder: "asc" } },
    },
  });

  revalidateDeviceCatalog();

  return NextResponse.json(withProperties ?? updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deviceType = await prisma.deviceModel.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ownedDevices: true,
          shells: true,
          wikiPages: true,
        },
      },
    },
  });

  if (!deviceType) {
    return NextResponse.json({ error: "Device type not found" }, { status: 404 });
  }

  const { ownedDevices, shells, wikiPages } = deviceType._count;
  if (ownedDevices > 0 || shells > 0 || wikiPages > 0) {
    const parts: string[] = [];
    if (ownedDevices > 0) parts.push(`${ownedDevices} collection item(s)`);
    if (shells > 0) parts.push(`${shells} shell(s)`);
    if (wikiPages > 0) parts.push(`${wikiPages} wiki page(s)`);

    return NextResponse.json(
      {
        error: `Cannot remove "${deviceType.name}" because it is used by ${parts.join(", ")}.`,
      },
      { status: 409 }
    );
  }

  await prisma.deviceModel.delete({ where: { id } });

  revalidateDeviceCatalog();

  return NextResponse.json({ ok: true });
}
