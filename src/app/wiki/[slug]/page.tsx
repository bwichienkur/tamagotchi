import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withDatabase } from "@/lib/db-query";
import { WikiPageView } from "@/components/wiki/wiki-page-view";

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
            shells: true,
          },
        },
        parent: true,
        children: true,
        citations: true,
      },
    });

    if (!page) notFound();

    let ownedCount = 0;
    if (session?.user?.id && page.deviceModelId) {
      ownedCount = await prisma.ownedDevice.count({
        where: { userId: session.user.id, deviceModelId: page.deviceModelId },
      });
    }

    return (
      <WikiPageView
        page={page}
        ownedCount={ownedCount}
        isAuthenticated={!!session?.user}
      />
    );
  });
}
