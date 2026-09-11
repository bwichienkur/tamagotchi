import { prisma } from "@/lib/prisma";

export async function getWishlistedShellIds(userId: string | undefined): Promise<string[]> {
  if (!userId) return [];

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { shellId: true },
  });

  return items.map((item) => item.shellId);
}
