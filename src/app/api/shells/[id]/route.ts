import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/session";
import { createSlug } from "@/lib/slug";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

const updateShellSchema = z.object({
  name: z.string().trim().min(1).max(120),
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
  const parsed = updateShellSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.shell.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Shell not found" }, { status: 404 });
  }

  const name = parsed.data.name;
  const slug = createSlug(name);

  const conflict = await prisma.shell.findFirst({
    where: {
      id: { not: id },
      deviceModelId: existing.deviceModelId,
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: `A shell named "${conflict.name}" already exists for this device type.` },
      { status: 409 }
    );
  }

  const updated = await prisma.shell.update({
    where: { id },
    data: { name, slug },
    include: {
      deviceModel: { select: { id: true, name: true } },
      _count: { select: { ownedDevices: true, wishlistItems: true } },
    },
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

  const shell = await prisma.shell.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ownedDevices: true,
          wishlistItems: true,
        },
      },
    },
  });

  if (!shell) {
    return NextResponse.json({ error: "Shell not found" }, { status: 404 });
  }

  const { ownedDevices, wishlistItems } = shell._count;
  if (ownedDevices > 0 || wishlistItems > 0) {
    const parts: string[] = [];
    if (ownedDevices > 0) parts.push(`${ownedDevices} collection item(s)`);
    if (wishlistItems > 0) parts.push(`${wishlistItems} wishlist item(s)`);

    return NextResponse.json(
      {
        error: `Cannot remove "${shell.name}" because it is used by ${parts.join(", ")}.`,
      },
      { status: 409 }
    );
  }

  await prisma.shell.delete({ where: { id } });

  revalidateDeviceCatalog();

  return NextResponse.json({ ok: true });
}
