import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ devices: [], shells: [], collection: [], wiki: [] });
  }

  const session = await auth();
  const userId = session?.user?.id;

  const [devices, shells, ownedDevices, wikiPages] = await Promise.all([
    prisma.deviceModel.findMany({
      where: {
        OR: [{ name: { contains: q, mode: "insensitive" } }],
      },
      include: { family: true },
      take: 5,
      orderBy: { name: "asc" },
    }),
    prisma.shell.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { colorDescription: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { deviceModel: true },
      take: 5,
      orderBy: { name: "asc" },
    }),
    userId
      ? prisma.ownedDevice.findMany({
          where: {
            userId,
            OR: [
              { nickname: { contains: q, mode: "insensitive" } },
              { notes: { contains: q, mode: "insensitive" } },
              { showMoreInfo: { contains: q, mode: "insensitive" } },
              { customShellName: { contains: q, mode: "insensitive" } },
              { deviceModel: { name: { contains: q, mode: "insensitive" } } },
              { shell: { name: { contains: q, mode: "insensitive" } } },
            ],
          },
          include: { deviceModel: true, shell: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.wikiPage.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      orderBy: { title: "asc" },
    }),
  ]);

  return NextResponse.json(
    {
      devices: devices.map((item) => ({
        type: "device" as const,
        id: item.id,
        title: item.name,
        subtitle: item.family?.name ?? undefined,
        href: `/devices/${item.slug}`,
        excerpt: item.description?.slice(0, 100),
      })),
      shells: shells.map((item) => ({
        type: "shell" as const,
        id: item.id,
        title: item.name,
        subtitle: item.deviceModel.name,
        href: `/devices/${item.deviceModel.slug}/shells/${item.slug}`,
      })),
      collection: ownedDevices.map((item) => ({
        type: "collection" as const,
        id: item.id,
        title: item.nickname ?? item.deviceModel.name,
        subtitle: item.shell?.name ?? item.customShellName ?? undefined,
        href: `/collection/${item.slug}`,
        image: item.primaryPhoto,
      })),
      wiki: wikiPages.map((item) => ({
        type: "wiki" as const,
        id: item.id,
        title: item.title,
        subtitle: "Wiki",
        href: `/wiki/${item.slug}`,
        excerpt: item.summary?.slice(0, 100),
      })),
    },
    {
      headers: {
        "Cache-Control": userId ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
