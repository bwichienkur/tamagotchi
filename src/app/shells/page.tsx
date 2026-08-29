import { ShellCatalogClient } from "@/components/shells/shell-catalog-client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function ShellCatalogPage() {
  const session = await auth();

  const [shells, families, deviceModels, wishlistItems] = await Promise.all([
    prisma.shell.findMany({
      include: {
        deviceModel: { include: { family: true } },
        _count: {
          select: {
            ownedDevices: session?.user?.id
              ? { where: { userId: session.user.id } }
              : false,
          },
        },
      },
      orderBy: [{ deviceModel: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.deviceFamily.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.deviceModel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    session?.user?.id
      ? prisma.wishlistItem.findMany({ where: { userId: session.user.id } })
      : Promise.resolve([]),
  ]);

  const wishlistSet = new Set(wishlistItems.map((w) => w.shellId));

  return (
    <ShellCatalogClient
      shells={shells.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        primaryImage: s.primaryImage,
        region: s.region,
        year: s.year,
        wave: s.wave,
        deviceModel: s.deviceModel,
        ownedCount: s._count.ownedDevices,
        wishlisted: wishlistSet.has(s.id),
      }))}
      families={families}
      deviceModels={deviceModels}
    />
  );
}
