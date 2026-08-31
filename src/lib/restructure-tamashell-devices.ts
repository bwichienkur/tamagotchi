import { createSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";
import {
  FAMILY_SLUG_MAP,
  TAMASHELL_CATALOG,
  isSingleDeviceTamaShellPage,
  getTamaShellCanonicalDevice,
  type TamaShellCatalogEntry,
} from "@/lib/importers/tamashell/catalog";
import { consolidateTamagotchiNanoDevices } from "@/lib/consolidate-tamagotchi-nano";
import {
  importMissingTamaShellShells,
  moveMatchingTamaShellShells,
} from "@/lib/importers/tamashell/import-shells";
import {
  buildSectionDeviceName,
  fetchTamaShellPage,
  flattenSectionShells,
  parseShellSectionsFromHtml,
} from "@/lib/importers/tamashell/scraper";

export interface RestructureTamaShellResult {
  devicesCreated: number;
  devicesRenamed: number;
  licensedRenamed: number;
  licensedConsolidated: number;
  shellsMoved: number;
  shellsImported: number;
  devicesRemoved: number;
}

const LEGACY_LICENSED_NANO_PREFIX = /^Licensed Tamagotchi Nanos?\b/i;

/** Rename legacy "Licensed Tamagotchi Nano(s) …" device types to "Tamagotchi Nano …". */
export async function renameLicensedTamagotchiNanoDevices(): Promise<number> {
  const models = await prisma.deviceModel.findMany({
    where: {
      OR: [
        { name: { equals: "Licensed Tamagotchi Nanos", mode: "insensitive" } },
        { name: { equals: "Licensed Tamagotchi Nano", mode: "insensitive" } },
        { name: { startsWith: "Licensed Tamagotchi Nanos ", mode: "insensitive" } },
        { name: { startsWith: "Licensed Tamagotchi Nano ", mode: "insensitive" } },
      ],
    },
  });

  let renamed = 0;
  for (const model of models) {
    const newName = model.name.replace(LEGACY_LICENSED_NANO_PREFIX, "Tamagotchi Nano").trim();
    if (newName === model.name) continue;

    let newSlug = createSlug(newName);
    const conflict = await prisma.deviceModel.findFirst({
      where: { slug: newSlug, NOT: { id: model.id } },
    });
    if (conflict) {
      newSlug = createSlug(`${newName} ${model.id.slice(-6)}`);
    }

    await prisma.deviceModel.update({
      where: { id: model.id },
      data: { name: newName, slug: newSlug },
    });
    renamed++;
  }

  return renamed;
}

function sectionDeviceSlug(entry: TamaShellCatalogEntry, sectionLabel: string | null) {
  if (!sectionLabel) return entry.slug;
  return createSlug(`${entry.slug} ${sectionLabel}`);
}

async function ensureSectionDevice(
  entry: TamaShellCatalogEntry,
  sectionLabel: string | null,
  familyId: string
) {
  const name = buildSectionDeviceName(entry.name, sectionLabel);
  const slug = sectionDeviceSlug(entry, sectionLabel);

  const existing = await prisma.deviceModel.findUnique({ where: { slug } });
  if (existing) {
    if (existing.name !== name) {
      await prisma.deviceModel.update({
        where: { id: existing.id },
        data: { name },
      });
      return { model: existing, renamed: true, created: false };
    }
    return { model: existing, renamed: false, created: false };
  }

  const byName = await prisma.deviceModel.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, familyId },
  });
  if (byName) {
    if (byName.name !== name) {
      await prisma.deviceModel.update({
        where: { id: byName.id },
        data: { name },
      });
    }
    return { model: byName, renamed: byName.name !== name, created: false };
  }

  const model = await prisma.deviceModel.create({
    data: {
      name,
      slug,
      familyId,
      manufacturer: "Bandai",
    },
  });
  return { model, renamed: false, created: true };
}

function legacyModelFilters(entry: TamaShellCatalogEntry, familyId: string) {
  const slugFilters: Array<{ slug: string } | { slug: { startsWith: string } }> = [
    { slug: entry.slug },
    { slug: { startsWith: `${entry.slug}-` } },
  ];

  if (entry.slug === "licensed") {
    slugFilters.push(
      { slug: "tamagotchi-nanos" },
      { slug: { startsWith: "tamagotchi-nanos-" } }
    );
  }

  return {
    familyId,
    OR: [
      ...slugFilters,
      { name: { equals: entry.name, mode: "insensitive" as const } },
    ],
  };
}

/**
 * Restructure imported TamaShell devices so each page section is its own device.
 * Moves shells from legacy combined models and removes empty device types.
 */
export async function restructureTamaShellDevices(options?: {
  skipNetwork?: boolean;
}): Promise<RestructureTamaShellResult> {
  if (options?.skipNetwork) {
    const licensedRenamed = await renameLicensedTamagotchiNanoDevices();
    revalidateDeviceCatalog();
    return {
      devicesCreated: 0,
      devicesRenamed: 0,
      licensedRenamed,
      licensedConsolidated: 0,
      shellsMoved: 0,
      shellsImported: 0,
      devicesRemoved: 0,
    };
  }

  let devicesCreated = 0;
  let devicesRenamed = 0;
  let shellsMoved = 0;
  let shellsImported = 0;

  const licensedRenamed = await renameLicensedTamagotchiNanoDevices();
  const nanoConsolidated = await consolidateTamagotchiNanoDevices();
  let licensedConsolidated = nanoConsolidated.shellsMoved;
  let devicesRemoved = nanoConsolidated.devicesRemoved;

  for (const entry of TAMASHELL_CATALOG) {
    const familyRecord = await prisma.deviceFamily.findUnique({
      where: { slug: FAMILY_SLUG_MAP[entry.family] },
    });
    if (!familyRecord) continue;

    try {
      const pageUrl = `https://www.tamashell.com/${entry.slug}`;
      const html = await fetchTamaShellPage(`/${entry.slug}`);
      const sections = parseShellSectionsFromHtml(html, pageUrl, entry.name, entry.slug);

      if (sections && isSingleDeviceTamaShellPage(entry)) {
        const canonical = getTamaShellCanonicalDevice(entry);
        const deviceModel = await prisma.deviceModel.findUnique({
          where: { slug: canonical.slug },
        });
        if (!deviceModel) continue;

        const flatShells = flattenSectionShells(sections);
        shellsImported += await importMissingTamaShellShells(deviceModel.id, flatShells, {
          storeSectionInWave: true,
        });
        continue;
      }

      if (!sections) continue;

      const targetModelIds = new Set<string>();

      for (const section of sections) {
        const { model, created, renamed } = await ensureSectionDevice(
          entry,
          section.sectionLabel,
          familyRecord.id
        );
        if (created) devicesCreated++;
        if (renamed) devicesRenamed++;
        targetModelIds.add(model.id);

        const legacyModels = await prisma.deviceModel.findMany({
          where: legacyModelFilters(entry, familyRecord.id),
        });
        const legacyModelIds = legacyModels
          .map((legacy) => legacy.id)
          .filter((legacyId) => legacyId !== model.id);

        shellsMoved += await moveMatchingTamaShellShells(
          model.id,
          section.shells,
          legacyModelIds
        );
        shellsImported += await importMissingTamaShellShells(model.id, section.shells);
      }

      const legacyModels = await prisma.deviceModel.findMany({
        where: {
          ...legacyModelFilters(entry, familyRecord.id),
          NOT: { id: { in: [...targetModelIds] } },
        },
        include: { _count: { select: { shells: true, ownedDevices: true } } },
      });

      for (const legacy of legacyModels) {
        if (legacy._count.shells === 0 && legacy._count.ownedDevices === 0) {
          await prisma.deviceModel.delete({ where: { id: legacy.id } });
          devicesRemoved++;
        }
      }
    } catch (error) {
      console.error(`Restructure failed for ${entry.name}:`, error);
    }
  }

  revalidateDeviceCatalog();

  return {
    devicesCreated,
    devicesRenamed,
    licensedRenamed,
    licensedConsolidated,
    shellsMoved,
    shellsImported,
    devicesRemoved,
  };
}
