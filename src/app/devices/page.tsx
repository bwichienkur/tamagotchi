import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ensureDatabase } from "@/lib/db-query";
import { Card, CardContent } from "@/components/ui/card";

export default async function DeviceLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ family?: string }>;
}) {
  await ensureDatabase();
  const { family: familySlug } = await searchParams;
  const session = await auth();

  const ownedByModel: Record<string, number> = {};
  if (session?.user?.id) {
    const owned = await prisma.ownedDevice.groupBy({
      by: ["deviceModelId"],
      where: { userId: session.user.id },
      _count: true,
    });
    for (const o of owned) {
      ownedByModel[o.deviceModelId] = o._count;
    }
  }

  const families = await prisma.deviceFamily.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      deviceModels: {
        include: {
          _count: { select: { shells: true } },
        },
        orderBy: { releaseYear: "asc" },
      },
    },
  });

  const filteredFamilies = familySlug
    ? families.filter((f) => f.slug === familySlug)
    : families;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Device Library</h1>
        <p className="mt-1 text-stone-500">
          Canonical database of Tamagotchi models
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/devices"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            !familySlug ? "bg-tama-cyan/10 text-tama-cyan" : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          All
        </Link>
        {families.map((f) => (
          <Link
            key={f.id}
            href={`/devices?family=${f.slug}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              familySlug === f.slug
                ? "bg-tama-cyan/10 text-tama-cyan"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {f.name}
          </Link>
        ))}
      </div>

      {filteredFamilies.map((family) => (
        <section key={family.id} className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-stone-800">{family.name}</h2>
          {family.description && (
            <p className="mb-6 text-stone-500">{family.description}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {family.deviceModels.map((model) => {
              const ownedCount = ownedByModel[model.id] ?? 0;
              return (
                <Link key={model.id} href={`/devices/${model.slug}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <div className="aspect-video bg-gradient-to-br from-stone-50 to-stone-100" />
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-stone-900">{model.name}</h3>
                      <p className="text-sm text-stone-500">
                        {model.releaseYear ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-stone-400">
                        {model._count.shells} known shells
                      </p>
                      {ownedCount > 0 && (
                        <p className="mt-2 text-xs font-medium text-tama-cyan">
                          ✓ Owned{ownedCount > 1 ? ` × ${ownedCount}` : ""}
                        </p>
                      )}
                      <span className="mt-2 inline-block text-sm text-tama-cyan">
                        View Device →
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
