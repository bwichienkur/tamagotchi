import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
