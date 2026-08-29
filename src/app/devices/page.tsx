import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withDatabase } from "@/lib/db-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function DeviceLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ family?: string }>;
}) {
  const { family: familySlug } = await searchParams;
  const session = await auth();

  const { ownedByModel, families } = await withDatabase(async () => {
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
            shells: {
              take: 1,
              orderBy: { name: "asc" },
              select: { primaryImage: true },
            },
          },
          orderBy: { releaseYear: "asc" },
        },
      },
    });

    return { ownedByModel, families };
  });

  const filteredFamilies = familySlug
    ? families.filter((f) => f.slug === familySlug)
    : families;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Device Library"
        subtitle="Canonical database of Tamagotchi models"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/devices"
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
            !familySlug ? "bg-gradient-to-r from-tama-cyan/20 to-tama-pink/15 text-tama-cyan shadow-sm" : "text-stone-600 hover:bg-white/80"
          }`}
        >
          All
        </Link>
        {families.map((f) => (
          <Link
            key={f.id}
            href={`/devices?family=${f.slug}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              familySlug === f.slug
                ? "bg-gradient-to-r from-tama-cyan/20 to-tama-pink/15 text-tama-cyan shadow-sm"
                : "text-stone-600 hover:bg-white/80"
            }`}
          >
            {f.name}
          </Link>
        ))}
      </div>

      {filteredFamilies.map((family) => (
        <section key={family.id} className="mb-12">
          <h2 className="mb-4 font-display text-2xl font-bold text-stone-800">{family.name}</h2>
          {family.description && (
            <p className="mb-6 text-stone-500">{family.description}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {family.deviceModels.map((model) => {
              const ownedCount = ownedByModel[model.id] ?? 0;
              const imageUrl = model.heroImage ?? model.shells[0]?.primaryImage ?? null;
              return (
                <Link key={model.id} href={`/devices/${model.slug}`}>
                  <Card className="cute-card h-full">
                    {imageUrl ? (
                      <div className="aspect-video overflow-hidden bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={model.name}
                          className="h-full w-full rounded-xl object-contain p-2"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10" />
                    )}
                    <CardContent className="pt-4">
                      <h3 className="font-display font-bold text-stone-900">{model.name}</h3>
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
