import { createSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";

export interface ConsolidateLicensedNanosResult {
  canonicalDeviceId: string;
  shellsMoved: number;
  devicesRemoved: number;
}

function sectionLabelFromDeviceName(name: string): string | null {
  const label = name.replace(/^Tamagotchi Nanos\s*/i, "").trim();
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
 * Merge Tamagotchi Nanos franchise section devices into one canonical device.
 * Each TamaShell franchise section becomes a shell (with optional wave label).
 */
export async function consolidateLicensedNanosDevices(): Promise<ConsolidateLicensedNanosResult> {
  const family = await prisma.deviceFamily.findUnique({ where: { slug: "modern" } });
  if (!family) {
    throw new Error("Modern device family not found");
  }

  let canonical = await prisma.deviceModel.findFirst({
    where: {
      familyId: family.id,
      OR: [
        { slug: "licensed" },
        { slug: "tamagotchi-nanos" },
        { name: { equals: "Tamagotchi Nanos", mode: "insensitive" } },
      ],
    },
  });

  if (!canonical) {
    canonical = await prisma.deviceModel.create({
      data: {
        name: "Tamagotchi Nanos",
        slug: "licensed",
        familyId: family.id,
        manufacturer: "Bandai",
      },
    });
  } else if (canonical.name !== "Tamagotchi Nanos") {
    canonical = await prisma.deviceModel.update({
      where: { id: canonical.id },
      data: { name: "Tamagotchi Nanos" },
    });
  }

  const sectionDevices = await prisma.deviceModel.findMany({
    where: {
      familyId: family.id,
      NOT: { id: canonical.id },
      OR: [
        { name: { startsWith: "Tamagotchi Nanos ", mode: "insensitive" } },
        { slug: { startsWith: "tamagotchi-nanos-" } },
        { slug: { startsWith: "licensed-" } },
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

  for (const sectionDevice of sectionDevices) {
    const sectionLabel = sectionLabelFromDeviceName(sectionDevice.name);

    for (const shell of sectionDevice.shells) {
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
      where: { deviceModelId: sectionDevice.id },
      data: { deviceModelId: canonical.id },
    });
    await prisma.wikiPage.updateMany({
      where: { deviceModelId: sectionDevice.id },
      data: { deviceModelId: canonical.id },
    });
  }

  let devicesRemoved = 0;
  for (const sectionDevice of sectionDevices) {
    const counts = await prisma.deviceModel.findUnique({
      where: { id: sectionDevice.id },
      include: { _count: { select: { shells: true, ownedDevices: true, wikiPages: true } } },
    });
    if (
      counts &&
      counts._count.shells === 0 &&
      counts._count.ownedDevices === 0 &&
      counts._count.wikiPages === 0
    ) {
      await prisma.deviceModel.delete({ where: { id: sectionDevice.id } });
      devicesRemoved++;
    }
  }

  revalidateDeviceCatalog();

  return {
    canonicalDeviceId: canonical.id,
    shellsMoved,
    devicesRemoved,
  };
}
