import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { findOrCreateDeviceSeries } from "@/lib/device-series-catalog";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

const updateDeviceTypeSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  familyId: z.string().optional(),
  seriesId: z.string().optional().nullable(),
  generation: z.string().trim().max(120).optional().nullable(),
});

const deviceTypeInclude = {
  family: { select: { id: true, name: true } },
  series: { select: { id: true, name: true } },
  _count: {
    select: {
      ownedDevices: true,
      shells: true,
      wikiPages: true,
    },
  },
} as const;

async function resolveSeriesAssignment(
  familyId: string,
  data: { seriesId?: string | null; generation?: string | null }
) {
  if (data.seriesId !== undefined) {
    if (!data.seriesId) {
      return { seriesId: null, generation: null };
    }
    const series = await prisma.deviceSeries.findUnique({ where: { id: data.seriesId } });
    if (!series) {
      throw new Error("Series not found");
    }
    if (series.familyId !== familyId) {
      throw new Error("Series must belong to the selected family");
    }
    return { seriesId: series.id, generation: series.name };
  }

  if (data.generation !== undefined) {
    if (!data.generation) {
      return { seriesId: null, generation: null };
    }
    const series = await findOrCreateDeviceSeries(familyId, data.generation);
    return { seriesId: series?.id ?? null, generation: data.generation };
  }

  return {};
}

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

  let seriesFields: { seriesId?: string | null; generation?: string | null } = {};
  try {
    seriesFields = await resolveSeriesAssignment(familyId, parsed.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid series" },
      { status: 400 }
    );
  }

  const updated = await prisma.deviceModel.update({
    where: { id },
    data: {
      name,
      slug,
      ...(parsed.data.familyId !== undefined && { familyId }),
      ...seriesFields,
    },
    include: deviceTypeInclude,
  });

  revalidateDeviceCatalog();

  return NextResponse.json(updated);
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
