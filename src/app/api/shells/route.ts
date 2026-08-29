import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceModelId = searchParams.get("deviceModelId");
  const q = searchParams.get("q") ?? "";

  const shells = await prisma.shell.findMany({
    where: {
      ...(deviceModelId ? { deviceModelId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { alternateNames: { hasSome: [q] } },
            ],
          }
        : {}),
    },
    include: {
      deviceModel: { include: { family: true } },
      _count: { select: { ownedDevices: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(shells);
}
