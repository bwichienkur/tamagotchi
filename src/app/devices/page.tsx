import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withDatabase } from "@/lib/db-query";
import { getDeviceFamiliesWithModels } from "@/lib/cached-data";
import { PageHeader } from "@/components/layout/page-header";
import { DeviceLibraryGrid } from "@/components/devices/device-library-grid";

function devicesHref(family?: string) {
  if (!family) return "/devices";
  return `/devices?family=${family}`;
}

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

    const families = await getDeviceFamiliesWithModels();

    return { ownedByModel, families };
  });

  const familiesToRender = familySlug
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
          href={devicesHref()}
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
            href={devicesHref(f.slug)}
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
