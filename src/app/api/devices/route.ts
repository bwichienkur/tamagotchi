import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { resolveFamilyIdForCreate } from "@/lib/device-family";

const createDeviceModelSchema = z.object({
  name: z.string().trim().min(1).max(120),
  familyId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const models = await prisma.deviceModel.findMany({
    where: q
      ? {
          OR: [{ name: { contains: q, mode: "insensitive" } }],
        }
      : undefined,
    include: {
      family: true,
      _count: { select: { shells: true } },
    },
    orderBy: [{ family: { sortOrder: "asc" } }, { releaseYear: "asc" }],
  });

  return NextResponse.json(models);
}

export async function POST(request: NextRequest) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createDeviceModelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const name = parsed.data.name;
  const slug = createSlug(name);

  const existing = await prisma.deviceModel.findFirst({
    where: {
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
    select: { id: true, name: true, slug: true },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const created = await prisma.deviceModel.create({
    data: {
      name,
      slug,
      familyId: await resolveFamilyIdForCreate(parsed.data.familyId),
    },
    select: { id: true, name: true, slug: true, familyId: true },
  });

  return NextResponse.json(created, { status: 201 });
}
