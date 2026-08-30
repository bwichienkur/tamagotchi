import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withDatabase } from "@/lib/db-query";
import { getDeviceFamiliesWithModels } from "@/lib/cached-data";
import { sortSeriesLabels } from "@/lib/device-series";
import { PageHeader } from "@/components/layout/page-header";
import { DeviceLibraryGrid } from "@/components/devices/device-library-grid";

function devicesHref(family?: string, generation?: string) {
  const params = new URLSearchParams();
  if (family) params.set("family", family);
  if (generation) params.set("generation", generation);
  const query = params.toString();
  return query ? `/devices?${query}` : "/devices";
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

  const availableGenerations = sortSeriesLabels([
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
            <DeviceLibraryGrid
              models={family.deviceModels}
              ownedByModel={ownedByModel}
            />
          </section>
        ))
      )}
    </div>
  );
}
