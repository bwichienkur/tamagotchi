import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

const updateSeriesSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  familyId: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

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
  const parsed = updateSeriesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.deviceSeries.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const name = parsed.data.name ?? existing.name;
  const familyId = parsed.data.familyId ?? existing.familyId;

  const conflict = await prisma.deviceSeries.findFirst({
    where: {
      id: { not: id },
      familyId,
      name: { equals: name, mode: "insensitive" },
    },
  });
  if (conflict) {
    return NextResponse.json(
      { error: `A series named "${conflict.name}" already exists in this family.` },
      { status: 409 }
    );
  }

  const family = await prisma.deviceFamily.findUnique({ where: { id: familyId } });
  if (!family) {
    return NextResponse.json({ error: "Family not found" }, { status: 404 });
  }

  const slugBase = createSlug(`${family.slug}-${name}`);
  let slug = slugBase;
  if (slug !== existing.slug) {
    let suffix = 2;
    while (
      await prisma.deviceSeries.findFirst({
        where: { slug, id: { not: id } },
      })
    ) {
      slug = `${slugBase}-${suffix}`;
      suffix++;
    }
  } else {
    slug = existing.slug;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const series = await tx.deviceSeries.update({
      where: { id },
      data: {
        name,
        slug,
        familyId,
        ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      },
      include: {
        family: { select: { id: true, name: true, slug: true } },
        _count: { select: { deviceModels: true } },
      },
    });

    if (name !== existing.name) {
      await tx.deviceModel.updateMany({
        where: { seriesId: id },
        data: { generation: name },
      });
    }

    return series;
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

  const series = await prisma.deviceSeries.findUnique({
    where: { id },
    include: { _count: { select: { deviceModels: true } } },
  });

  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  if (series._count.deviceModels > 0) {
    return NextResponse.json(
      {
        error: `Cannot remove "${series.name}" because it is used by ${series._count.deviceModels} device type(s).`,
      },
      { status: 409 }
    );
  }

  await prisma.deviceSeries.delete({ where: { id } });

  revalidateDeviceCatalog();

  return NextResponse.json({ ok: true });
}
