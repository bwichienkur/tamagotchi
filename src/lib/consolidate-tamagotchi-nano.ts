import { createSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

export const TAMAGOTCHI_NANO_CANONICAL = {
  slug: "nano",
  name: "Tamagotchi Nano",
} as const;

export interface ConsolidateTamagotchiNanoResult {
  canonicalDeviceId: string;
  shellsMoved: number;
  devicesRemoved: number;
}

function waveLabelFromMergedDevice(deviceName: string, deviceSlug: string): string | null {
  if (deviceSlug === "nano-special-edition") return "Special Edition";
  if (/^Tamagotchi Nanos?\s*$/i.test(deviceName.trim())) return null;

  const label = deviceName.replace(/^Tamagotchi Nanos?\s*/i, "").trim();
  return label || null;
}

function uniqueShellSlug(
  shellName: string,
  sectionLabel: string | null,
  usedSlugs: Set<string>
): string {
  const candidates = [
    createSlug(shellName),
    sectionLabel ? createSlug(`${sectionLabel} ${shellName}`) : null,
    createSlug(`${shellName}-${usedSlugs.size + 1}`),
  ].filter(Boolean) as string[];

  for (const slug of candidates) {
    if (!usedSlugs.has(slug)) {
      usedSlugs.add(slug);
      return slug;
    }
  }

  const fallback = createSlug(`${sectionLabel ?? "shell"}-${shellName}-${usedSlugs.size + 1}`);
  usedSlugs.add(fallback);
  return fallback;
}

/**
 * Merge Tamagotchi Nano, Nanos, licensed franchise shells, and Special Edition
 * into one canonical Tamagotchi Nano device.
 */
export async function consolidateTamagotchiNanoDevices(): Promise<ConsolidateTamagotchiNanoResult> {
  const family = await prisma.deviceFamily.findUnique({ where: { slug: "modern" } });
  if (!family) {
    throw new Error("Modern device family not found");
  }

  let canonical = await prisma.deviceModel.findUnique({
    where: { slug: TAMAGOTCHI_NANO_CANONICAL.slug },
  });

  if (!canonical) {
    canonical = await prisma.deviceModel.findFirst({
      where: {
        familyId: family.id,
        OR: [
          { slug: "tamagotchi-nanos" },
          { slug: "licensed" },
          { name: { equals: TAMAGOTCHI_NANO_CANONICAL.name, mode: "insensitive" } },
          { name: { equals: "Tamagotchi Nanos", mode: "insensitive" } },
        ],
      },
    });
  }

  if (!canonical) {
    canonical = await prisma.deviceModel.create({
      data: {
        name: TAMAGOTCHI_NANO_CANONICAL.name,
        slug: TAMAGOTCHI_NANO_CANONICAL.slug,
        familyId: family.id,
        manufacturer: "Bandai",
      },
    });
  } else if (
    canonical.slug !== TAMAGOTCHI_NANO_CANONICAL.slug ||
    canonical.name !== TAMAGOTCHI_NANO_CANONICAL.name
  ) {
    const slugConflict = await prisma.deviceModel.findFirst({
      where: {
        slug: TAMAGOTCHI_NANO_CANONICAL.slug,
        NOT: { id: canonical.id },
      },
    });

    canonical = await prisma.deviceModel.update({
      where: { id: canonical.id },
      data: {
        name: TAMAGOTCHI_NANO_CANONICAL.name,
        ...(slugConflict ? {} : { slug: TAMAGOTCHI_NANO_CANONICAL.slug }),
      },
    });
  }

  const mergeSources = await prisma.deviceModel.findMany({
    where: {
      familyId: family.id,
      NOT: { id: canonical.id },
      OR: [
        { slug: "tamagotchi-nanos" },
        { slug: "licensed" },
        { slug: "nano-special-edition" },
        { slug: { startsWith: "tamagotchi-nanos-" } },
        { slug: { startsWith: "licensed-" } },
        { name: { equals: "Tamagotchi Nanos", mode: "insensitive" } },
        { name: { startsWith: "Tamagotchi Nanos ", mode: "insensitive" } },
        { name: { equals: "Tamagotchi Nano Special Edition", mode: "insensitive" } },
      ],
    },
    include: { shells: true },
  });

  const usedSlugs = new Set(
    (
      await prisma.shell.findMany({
        where: { deviceModelId: canonical.id },
        select: { slug: true },
      })
    ).map((shell) => shell.slug)
  );

  let shellsMoved = 0;

  for (const sourceDevice of mergeSources) {
    const sectionLabel = waveLabelFromMergedDevice(sourceDevice.name, sourceDevice.slug);

    for (const shell of sourceDevice.shells) {
      let slug = shell.slug;
      if (shell.deviceModelId !== canonical.id || usedSlugs.has(slug)) {
        slug = uniqueShellSlug(shell.name, sectionLabel, usedSlugs);
      } else {
        usedSlugs.add(slug);
      }

      const conflict = await prisma.shell.findFirst({
        where: {
          deviceModelId: canonical.id,
          slug,
          NOT: { id: shell.id },
        },
      });

      if (conflict) {
        await prisma.shell.delete({ where: { id: shell.id } });
        continue;
      }

      await prisma.shell.update({
        where: { id: shell.id },
        data: {
          deviceModelId: canonical.id,
          slug,
          wave: shell.wave ?? sectionLabel ?? undefined,
        },
      });
      shellsMoved++;
    }

    await prisma.ownedDevice.updateMany({
      where: { deviceModelId: sourceDevice.id },
      data: { deviceModelId: canonical.id },
    });
    await prisma.wikiPage.updateMany({
      where: { deviceModelId: sourceDevice.id },
      data: { deviceModelId: canonical.id },
    });
    await prisma.deviceProperty.updateMany({
      where: { deviceModelId: sourceDevice.id },
      data: { deviceModelId: canonical.id },
    });
    await prisma.galleryImage.updateMany({
      where: { deviceModelId: sourceDevice.id },
      data: { deviceModelId: canonical.id },
    });
  }

  let devicesRemoved = 0;
  for (const sourceDevice of mergeSources) {
    const counts = await prisma.deviceModel.findUnique({
      where: { id: sourceDevice.id },
      include: { _count: { select: { shells: true, ownedDevices: true, wikiPages: true } } },
    });
    if (
      counts &&
      counts._count.shells === 0 &&
      counts._count.ownedDevices === 0 &&
      counts._count.wikiPages === 0
    ) {
      await prisma.deviceModel.delete({ where: { id: sourceDevice.id } });
      devicesRemoved++;
    }
  }

  if (canonical.slug !== TAMAGOTCHI_NANO_CANONICAL.slug) {
    const existingNano = await prisma.deviceModel.findUnique({
      where: { slug: TAMAGOTCHI_NANO_CANONICAL.slug },
    });
    if (!existingNano) {
      canonical = await prisma.deviceModel.update({
        where: { id: canonical.id },
        data: { slug: TAMAGOTCHI_NANO_CANONICAL.slug },
      });
    }
  }

  revalidateDeviceCatalog();

  return {
    canonicalDeviceId: canonical.id,
    shellsMoved,
    devicesRemoved,
  };
}

/** @deprecated Use consolidateTamagotchiNanoDevices */
export const consolidateLicensedNanosDevices = consolidateTamagotchiNanoDevices;
