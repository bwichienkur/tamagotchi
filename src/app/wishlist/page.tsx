import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">Wishlist</h1>

      {items.length === 0 ? (
        <p className="text-stone-500">No shells on your wishlist yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <h3 className="font-semibold">{item.shell.name}</h3>
                  <p className="text-sm text-stone-500">{item.shell.deviceModel.name}</p>
                  {item.notes && <p className="mt-1 text-sm text-stone-400">{item.notes}</p>}
                </div>
                <Link href={`/devices/${item.shell.deviceModel.slug}/shells/${item.shell.slug}`}>
                  <Button variant="outline" size="sm">View Shell</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
