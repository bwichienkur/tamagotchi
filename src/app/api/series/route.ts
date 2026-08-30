import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

const createSeriesSchema = z.object({
  name: z.string().trim().min(1).max(120),
  familyId: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const series = await prisma.deviceSeries.findMany({
    include: {
      family: { select: { id: true, name: true, slug: true } },
      _count: { select: { deviceModels: true } },
    },
    orderBy: [{ family: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(series);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSeriesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, familyId, sortOrder } = parsed.data;

  const family = await prisma.deviceFamily.findUnique({ where: { id: familyId } });
  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  const existing = await prisma.deviceSeries.findUnique({
    where: { familyId_name: { familyId, name } },
    include: {
      family: { select: { id: true, name: true, slug: true } },
      _count: { select: { deviceModels: true } },
    },
  });
  if (existing) {
    return NextResponse.json(existing);
  }

  const slugBase = createSlug(`${family.slug}-${name}`);
  let slug = slugBase;
  let suffix = 2;
  while (await prisma.deviceSeries.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${suffix}`;
    suffix++;
  }

  const created = await prisma.deviceSeries.create({
    data: {
      name,
      slug,
      familyId,
      sortOrder: sortOrder ?? 0,
    },
    include: {
      family: { select: { id: true, name: true, slug: true } },
      _count: { select: { deviceModels: true } },
    },
  });

  revalidateDeviceCatalog();

  return NextResponse.json(created, { status: 201 });
}
