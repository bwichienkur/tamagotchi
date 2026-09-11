import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { WishlistPageClient } from "@/components/wishlist/wishlist-page-client";

export default async function WishlistPage() {
  const session = await requireAuth();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      shell: { include: { deviceModel: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return (
    <WishlistPageClient
      initialItems={items.map((item) => ({
        id: item.id,
        shellId: item.shellId,
        notes: item.notes,
        shell: {
          id: item.shell.id,
          name: item.shell.name,
          slug: item.shell.slug,
          primaryImage: item.shell.primaryImage,
          region: item.shell.region,
          year: item.shell.year,
          deviceModel: {
            name: item.shell.deviceModel.name,
            slug: item.shell.deviceModel.slug,
          },
        },
      }))}
    />
  );
}
