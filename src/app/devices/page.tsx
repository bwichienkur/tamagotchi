import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withDatabase } from "@/lib/db-query";
import { getDeviceFamiliesWithModels } from "@/lib/cached-data";
import {
  DEVICE_GENERATION_PRESETS,
  type DeviceGenerationPreset,
} from "@/lib/device-generations";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";

function devicesHref(family?: string, generation?: string) {
  const params = new URLSearchParams();
  if (family) params.set("family", family);
  if (generation) params.set("generation", generation);
  const query = params.toString();
  return query ? `/devices?${query}` : "/devices";
}

function sortGenerations(generations: string[]) {
  return [...generations].sort((a, b) => {
    const ai = DEVICE_GENERATION_PRESETS.indexOf(a as DeviceGenerationPreset);
    const bi = DEVICE_GENERATION_PRESETS.indexOf(b as DeviceGenerationPreset);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default async function DeviceLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ family?: string; generation?: string }>;
}) {
  const { family: familySlug, generation: generationFilter } = await searchParams;
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

    const families = await getDeviceFamiliesWithModels();

    return { ownedByModel, families };
  });

  const scopedFamilies = familySlug
    ? families.filter((f) => f.slug === familySlug)
    : families;

  const availableGenerations = sortGenerations([
    ...new Set(
      scopedFamilies
        .flatMap((family) => family.deviceModels)
        .map((model) => model.generation)
        .filter((value): value is string => Boolean(value))
    ),
  ]);

  const familiesToRender = scopedFamilies
    .map((family) => ({
      ...family,
      deviceModels: family.deviceModels.filter(
        (model) => !generationFilter || model.generation === generationFilter
      ),
    }))
    .filter((family) => family.deviceModels.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Device Library"
        subtitle="Canonical database of Tamagotchi models"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={devicesHref(undefined, generationFilter)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
            !familySlug
              ? "bg-gradient-to-r from-tama-cyan/20 to-tama-pink/15 text-tama-cyan shadow-sm"
              : "text-stone-600 hover:bg-white/80"
          }`}
        >
          All
        </Link>
        {families.map((f) => (
          <Link
            key={f.id}
            href={devicesHref(f.slug, generationFilter)}
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

      {availableGenerations.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={devicesHref(familySlug)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              !generationFilter
                ? "bg-stone-800 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All series
          </Link>
          {availableGenerations.map((generation) => (
            <Link
              key={generation}
              href={devicesHref(familySlug, generation)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                generationFilter === generation
                  ? "bg-stone-800 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {generation}
            </Link>
          ))}
        </div>
      )}

      {familiesToRender.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 px-4 py-12 text-center text-sm text-stone-500">
          No devices match the current filters.
        </div>
      ) : (
        familiesToRender.map((family) => (
          <section key={family.id} className="mb-12">
            <h2 className="mb-4 font-display text-2xl font-bold text-stone-800">
              {family.name}
            </h2>
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
                        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10 p-2">
                          <RemoteImage
                            src={imageUrl}
                            alt={model.name}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10" />
                      )}
                      <CardContent className="pt-4">
                        <h3 className="font-display font-bold text-stone-900">
                          {model.name}
                        </h3>
                        {model.generation && (
                          <p className="text-xs font-medium text-stone-500">
                            {model.generation}
                          </p>
                        )}
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
        ))
      )}
    </div>
  );
}
