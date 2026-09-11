import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export async function PATCH(request: NextRequest) {
  const session = await requireAuth();
  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { orderedIds } = parsed.data;
  const uniqueIds = new Set(orderedIds);
  if (uniqueIds.size !== orderedIds.length) {
    return NextResponse.json({ error: "Duplicate wishlist item ids" }, { status: 400 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id, id: { in: orderedIds } },
    select: { id: true },
  });

  if (items.length !== orderedIds.length) {
    return NextResponse.json({ error: "Invalid wishlist item ids" }, { status: 400 });
  }

  const allItems = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (allItems.length !== orderedIds.length) {
    return NextResponse.json(
      { error: "orderedIds must include every wishlist item" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.wishlistItem.update({
        where: { id },
        data: { priority: orderedIds.length - index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
