import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { resolveFamilyIdForCreate } from "@/lib/device-family";
import { findOrCreateDeviceSeries } from "@/lib/device-series-catalog";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

const createDeviceTypeSchema = z.object({
  name: z.string().trim().min(1).max(120),
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
  if (data.seriesId) {
    const series = await prisma.deviceSeries.findUnique({ where: { id: data.seriesId } });
    if (!series) {
      throw new Error("Series not found");
    }
    if (series.familyId !== familyId) {
      throw new Error("Series must belong to the selected family");
    }
    return { seriesId: series.id, generation: series.name };
  }

  if (data.generation) {
    const series = await findOrCreateDeviceSeries(familyId, data.generation);
    return { seriesId: series?.id ?? null, generation: data.generation };
  }

  return { seriesId: null, generation: null };
}

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deviceTypes = await prisma.deviceModel.findMany({
    include: deviceTypeInclude,
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
  const familyId = await resolveFamilyIdForCreate(parsed.data.familyId);

  const existing = await prisma.deviceModel.findFirst({
    where: {
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
    include: deviceTypeInclude,
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  let seriesFields = { seriesId: null as string | null, generation: null as string | null };
  try {
    seriesFields = await resolveSeriesAssignment(familyId, parsed.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid series" },
      { status: 400 }
    );
  }

  const created = await prisma.deviceModel.create({
    data: {
      name,
      slug,
      familyId,
      ...seriesFields,
    },
    include: deviceTypeInclude,
  });

  revalidateDeviceCatalog();

  return NextResponse.json(created, { status: 201 });
}
