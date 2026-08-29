import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ devices: [], shells: [], collection: [], wiki: [] });
  }

  const session = await auth();

  const [devices, shells, ownedDevices, wikiPages] = await Promise.all([
    prisma.deviceModel.findMany({
      include: { family: true },
      take: 100,
    }),
    prisma.shell.findMany({
      include: { deviceModel: true },
      take: 200,
    }),
    session?.user?.id
      ? prisma.ownedDevice.findMany({
          where: { userId: session.user.id },
          include: { deviceModel: true, shell: true },
        })
      : Promise.resolve([]),
    prisma.wikiPage.findMany({ take: 100 }),
  ]);

  const deviceFuse = new Fuse(devices, {
    keys: ["name", "alternateNames", "generation"],
    threshold: 0.4,
  });

  const shellFuse = new Fuse(shells, {
    keys: ["name", "alternateNames", "colorDescription"],
    threshold: 0.4,
  });

  const collectionFuse = new Fuse(ownedDevices, {
    keys: ["nickname", "notes", "showMoreInfo", "deviceModel.name", "shell.name", "customShellName"],
    threshold: 0.4,
  });

  const wikiFuse = new Fuse(wikiPages, {
    keys: ["title", "summary", "slug"],
    threshold: 0.4,
  });

  const deviceResults = deviceFuse.search(q, { limit: 5 }).map((r) => ({
    type: "device" as const,
    id: r.item.id,
    title: r.item.name,
    subtitle: r.item.family?.name ?? undefined,
    href: `/devices/${r.item.slug}`,
    excerpt: r.item.description?.slice(0, 100),
  }));

  const shellResults = shellFuse.search(q, { limit: 5 }).map((r) => ({
    type: "shell" as const,
    id: r.item.id,
    title: r.item.name,
    subtitle: r.item.deviceModel.name,
    href: `/devices/${r.item.deviceModel.slug}/shells/${r.item.slug}`,
  }));

  const collectionResults = collectionFuse.search(q, { limit: 5 }).map((r) => ({
    type: "collection" as const,
    id: r.item.id,
    title: r.item.nickname ?? r.item.deviceModel.name,
    subtitle: r.item.shell?.name ?? r.item.customShellName ?? undefined,
    href: `/collection/${r.item.slug}`,
    image: r.item.primaryPhoto,
  }));

  const wikiResults = wikiFuse.search(q, { limit: 5 }).map((r) => ({
    type: "wiki" as const,
    id: r.item.id,
    title: r.item.title,
    subtitle: "Wiki",
    href: `/wiki/${r.item.slug}`,
    excerpt: r.item.summary?.slice(0, 100),
  }));

  return NextResponse.json({
    devices: deviceResults,
    shells: shellResults,
    collection: collectionResults,
    wiki: wikiResults,
  });
}
