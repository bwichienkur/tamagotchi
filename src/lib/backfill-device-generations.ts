import { createSlug, normalizeName } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";
import {
  FAMILY_SLUG_MAP,
  TAMASHELL_CATALOG,
  TAMASHELL_SECTIONED_PAGE_SLUGS,
  type TamaShellCatalogEntry,
} from "@/lib/importers/tamashell/catalog";
import {
  fetchTamaShellPage,
  parseShellSectionsFromHtml,
} from "@/lib/importers/tamashell/scraper";
import { DEVICE_GENERATION_PRESETS } from "@/lib/device-generations";

export interface BackfillGenerationsResult {
  catalogUpdated: number;
  slugUpdated: number;
  sectionsEnsured: number;
  shellsMoved: number;
  shellsSkipped: number;
  invalidModelsRemoved: number;
}

export function inferGenerationFromSlug(
  modelSlug: string,
  catalogSlug: string
): string | null {
  const prefix = `${catalogSlug}-`;
  if (!modelSlug.startsWith(prefix)) return null;

  const suffix = modelSlug.slice(prefix.length);
  for (const preset of DEVICE_GENERATION_PRESETS) {
    if (createSlug(preset) === suffix) {
      return preset;
    }
  }
  return null;
}

function inferGenerationForModel(
  model: { slug: string; name: string },
  entry: TamaShellCatalogEntry
): string | null {
  const fromSlug = inferGenerationFromSlug(model.slug, entry.slug);
  if (fromSlug) return fromSlug;

  if (model.name.localeCompare(entry.name, undefined, { sensitivity: "accent" }) === 0) {
    return entry.generation ?? null;
  }

  return null;
}

async function backfillCatalogGenerations(): Promise<number> {
  let updated = 0;

  for (const entry of TAMASHELL_CATALOG) {
    if (!entry.generation) continue;

    const models = await prisma.deviceModel.findMany({
      where: { name: { equals: entry.name, mode: "insensitive" } },
    });

    for (const model of models) {
      if (model.generation === entry.generation) continue;
      if (models.length > 1 && model.generation) continue;

      await prisma.deviceModel.update({
        where: { id: model.id },
        data: { generation: entry.generation },
      });
      updated++;
    }
  }

  return updated;
}

async function backfillSlugGenerations(): Promise<number> {
  let updated = 0;

  const models = await prisma.deviceModel.findMany({
    where: { generation: null },
  });

  for (const model of models) {
    for (const entry of TAMASHELL_CATALOG) {
      const generation = inferGenerationForModel(model, entry);
      if (!generation) continue;

      await prisma.deviceModel.update({
        where: { id: model.id },
        data: { generation },
      });
      updated++;
      break;
    }
  }

  return updated;
}

async function ensureGenerationModel(params: {
  entry: TamaShellCatalogEntry;
  familyId: string;
  generation: string;
}): Promise<{ id: string; created: boolean }> {
  const { entry, familyId, generation } = params;
  const modelSlug = createSlug(`${entry.slug} ${generation}`);

  const existing = await prisma.deviceModel.findFirst({
    where: {
      OR: [
        { slug: modelSlug },
        {
          name: { equals: entry.name, mode: "insensitive" },
          generation,
        },
      ],
    },
  });

  if (existing) {
    if (!existing.generation) {
      await prisma.deviceModel.update({
        where: { id: existing.id },
        data: { generation },
      });
    }
    return { id: existing.id, created: false };
  }

  const created = await prisma.deviceModel.create({
    data: {
      name: entry.name,
      slug: modelSlug,
      familyId,
      generation,
      manufacturer: "Bandai",
    },
  });

  return { id: created.id, created: true };
}

async function backfillSectionedCatalogEntry(
  entry: TamaShellCatalogEntry
): Promise<{ sectionsEnsured: number; shellsMoved: number; shellsSkipped: number }> {
  const familySlug = FAMILY_SLUG_MAP[entry.family];
  const family = await prisma.deviceFamily.findUnique({ where: { slug: familySlug } });
  if (!family) {
    return { sectionsEnsured: 0, shellsMoved: 0, shellsSkipped: 0 };
  }

  const pageUrl = `https://www.tamashell.com/${entry.slug}`;
  const html = await fetchTamaShellPage(`/${entry.slug}`);
  const sections = parseShellSectionsFromHtml(html, pageUrl, entry.name, entry.slug);
  if (!sections?.length) {
    return { sectionsEnsured: 0, shellsMoved: 0, shellsSkipped: 0 };
  }

  const shellToGeneration = new Map<string, string>();
  const generationToModelId = new Map<string, string>();
  let sectionsEnsured = 0;

  for (const section of sections) {
    const { id: modelId, created } = await ensureGenerationModel({
      entry,
      familyId: family.id,
      generation: section.generation,
    });
    generationToModelId.set(section.generation, modelId);
    if (created) sectionsEnsured++;

    for (const shell of section.shells) {
      shellToGeneration.set(normalizeName(shell.name), section.generation);
    }
  }

  const sectionSlugs = new Set(
    sections.map((section) => createSlug(`${entry.slug} ${section.generation}`))
  );

  const legacyModels = await prisma.deviceModel.findMany({
    where: {
      name: { equals: entry.name, mode: "insensitive" },
      slug: { notIn: [...sectionSlugs] },
    },
    include: {
      shells: true,
      _count: { select: { ownedDevices: true, wikiPages: true, shells: true } },
    },
  });

  let shellsMoved = 0;
  let shellsSkipped = 0;

  for (const legacy of legacyModels) {
    for (const shell of legacy.shells) {
      const generation = shellToGeneration.get(normalizeName(shell.name));
      if (!generation) {
        shellsSkipped++;
        continue;
      }

      const targetModelId = generationToModelId.get(generation);
      if (!targetModelId || targetModelId === legacy.id) {
        shellsSkipped++;
        continue;
      }

      const duplicate = await prisma.shell.findFirst({
        where: {
          deviceModelId: targetModelId,
          name: { equals: shell.name, mode: "insensitive" },
        },
      });

      if (duplicate) {
        await prisma.shell.delete({ where: { id: shell.id } });
        shellsSkipped++;
        continue;
      }

      await prisma.shell.update({
        where: { id: shell.id },
        data: { deviceModelId: targetModelId },
      });
      shellsMoved++;
    }

    const refreshed = await prisma.deviceModel.findUnique({
      where: { id: legacy.id },
      include: {
        _count: { select: { ownedDevices: true, wikiPages: true, shells: true } },
      },
    });

    if (
      refreshed &&
      refreshed._count.shells === 0 &&
      refreshed._count.ownedDevices === 0 &&
      refreshed._count.wikiPages === 0
    ) {
      await prisma.deviceModel.delete({ where: { id: legacy.id } });
    }
  }

  return { sectionsEnsured, shellsMoved, shellsSkipped };
}

async function cleanupInvalidSectionedModels(
  entry: TamaShellCatalogEntry,
  validGenerations: string[]
): Promise<number> {
  const invalidModels = await prisma.deviceModel.findMany({
    where: {
      name: { equals: entry.name, mode: "insensitive" },
      generation: { not: null, notIn: validGenerations },
    },
    include: {
      _count: { select: { ownedDevices: true, wikiPages: true, shells: true } },
    },
  });

  let removed = 0;
  for (const model of invalidModels) {
    if (
      model._count.shells === 0 &&
      model._count.ownedDevices === 0 &&
      model._count.wikiPages === 0
    ) {
      await prisma.deviceModel.delete({ where: { id: model.id } });
      removed++;
    }
  }
  return removed;
}

/** Backfill DeviceModel.generation from TamaShell catalog metadata and section data. */
export async function backfillDeviceGenerations(options?: {
  skipNetwork?: boolean;
}): Promise<BackfillGenerationsResult> {
  const catalogUpdated = await backfillCatalogGenerations();
  const slugUpdated = await backfillSlugGenerations();

  let sectionsEnsured = 0;
  let shellsMoved = 0;
  let shellsSkipped = 0;
  let invalidModelsRemoved = 0;

  if (!options?.skipNetwork) {
    for (const slug of TAMASHELL_SECTIONED_PAGE_SLUGS) {
      const entry = TAMASHELL_CATALOG.find((item) => item.slug === slug);
      if (!entry) continue;

      try {
        const result = await backfillSectionedCatalogEntry(entry);
        sectionsEnsured += result.sectionsEnsured;
        shellsMoved += result.shellsMoved;
        shellsSkipped += result.shellsSkipped;

        if (entry.slug === "original") {
          invalidModelsRemoved += await cleanupInvalidSectionedModels(entry, [
            ...DEVICE_GENERATION_PRESETS,
          ]);
        }
      } catch (error) {
        console.error(`Section backfill failed for ${entry.name}:`, error);
      }
    }
  }

  revalidateDeviceCatalog();

  return {
    catalogUpdated,
    slugUpdated,
    sectionsEnsured,
    shellsMoved,
    shellsSkipped,
    invalidModelsRemoved,
  };
}
