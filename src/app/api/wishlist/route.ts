import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const session = await requireAuth();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      shell: { include: { deviceModel: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  const { shellId } = await request.json();

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_shellId: { userId: session.user.id, shellId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ wishlisted: false });
  }

  await prisma.wishlistItem.create({
    data: { userId: session.user.id, shellId },
  });

  return NextResponse.json({ wishlisted: true });
}
