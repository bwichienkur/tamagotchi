import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  const devices = await prisma.ownedDevice.findMany({
    where: { userId: session.user.id },
    include: { deviceModel: true, shell: true },
  });

  if (format === "csv") {
    const headers = [
      "slug",
      "deviceModel",
      "shell",
      "nickname",
      "condition",
      "purchaseDate",
      "purchasePrice",
      "purchasedFrom",
      "favorite",
      "notes",
    ];
    const rows = devices.map((d) =>
      [
        d.slug,
        d.deviceModel.name,
        d.shell?.name ?? d.customShellName ?? "",
        d.nickname ?? "",
        d.conditionBadge,
        d.purchaseDate?.toISOString() ?? "",
        d.purchasePrice?.toString() ?? "",
        d.purchasedFrom ?? "",
        d.favorite.toString(),
        d.notes ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="tamadex-collection.csv"',
      },
    });
  }

  return NextResponse.json(devices, {
    headers: {
      "Content-Disposition": 'attachment; filename="tamadex-collection.json"',
    },
  });
}
