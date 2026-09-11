import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withDatabase } from "@/lib/db-query";
import { WikiPageView } from "@/components/wiki/wiki-page-view";
import { getWishlistedShellIds } from "@/lib/wishlist-data";

export default async function WikiSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  return withDatabase(async () => {
    const page = await prisma.wikiPage.findUnique({
      where: { slug },
      include: {
        deviceModel: {
          include: {
            family: true,
            properties: { orderBy: { sortOrder: "asc" } },
            shells: { orderBy: { name: "asc" } },
          },
        },
        parent: true,
        children: true,
        citations: true,
      },
    });

    if (!page) notFound();

    let ownedCount = 0;
    let shells: Array<{
      id: string;
      name: string;
      slug: string;
      primaryImage: string | null;
      region: string | null;
      year: number | null;
      ownedCount: number;
    }> = [];
    const wishlistedShellIds = await getWishlistedShellIds(session?.user?.id);

    if (session?.user?.id && page.deviceModelId) {
      ownedCount = await prisma.ownedDevice.count({
        where: { userId: session.user.id, deviceModelId: page.deviceModelId },
      });

      if (page.deviceModel) {
        const owned = await prisma.ownedDevice.groupBy({
          by: ["shellId"],
          where: {
            userId: session.user.id,
            deviceModelId: page.deviceModelId,
            shellId: { not: null },
          },
          _count: true,
        });
        const ownedByShell = Object.fromEntries(
          owned.filter((entry) => entry.shellId).map((entry) => [entry.shellId!, entry._count])
        );

        shells = page.deviceModel.shells.map((shell) => ({
          id: shell.id,
          name: shell.name,
          slug: shell.slug,
          primaryImage: shell.primaryImage,
          region: shell.region,
          year: shell.year,
          ownedCount: ownedByShell[shell.id] ?? 0,
        }));
      }
    } else if (page.deviceModel) {
      shells = page.deviceModel.shells.map((shell) => ({
        id: shell.id,
        name: shell.name,
        slug: shell.slug,
        primaryImage: shell.primaryImage,
        region: shell.region,
        year: shell.year,
        ownedCount: 0,
      }));
    }

    return (
      <WikiPageView
        page={page}
        ownedCount={ownedCount}
        isAuthenticated={!!session?.user}
        shells={shells}
        wishlistedShellIds={wishlistedShellIds}
      />
    );
  });
}
