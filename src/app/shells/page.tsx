import { ShellCatalogClient } from "@/components/shells/shell-catalog-client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ensureDatabase } from "@/lib/db-query";

export default async function ShellCatalogPage() {
  await ensureDatabase();
  const session = await auth();
  const userId = session?.user?.id;

  const [shells, families, deviceModels, wishlistItems] = await Promise.all([
    prisma.shell.findMany({
      include: {
        deviceModel: { include: { family: true } },
        ...(userId
          ? {
              _count: {
                select: {
                  ownedDevices: { where: { userId } },
                },
              },
            }
          : {}),
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
        ownedCount: userId && "_count" in s ? s._count.ownedDevices : 0,
        wishlisted: wishlistSet.has(s.id),
      }))}
      families={families}
      deviceModels={deviceModels}
    />
  );
}
