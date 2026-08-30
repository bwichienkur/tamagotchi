import { createSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import { revalidateDeviceCatalog } from "@/lib/revalidate-catalog";
import {
  FAMILY_SLUG_MAP,
  TAMASHELL_CATALOG,
  type TamaShellCatalogEntry,
} from "@/lib/importers/tamashell/catalog";
import {
  buildSectionDeviceName,
  fetchTamaShellPage,
  parseShellSectionsFromHtml,
} from "@/lib/importers/tamashell/scraper";

export interface RestructureTamaShellResult {
  devicesCreated: number;
  devicesRenamed: number;
  shellsMoved: number;
  devicesRemoved: number;
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
    if (byName.slug !== slug) {
      await prisma.deviceModel.update({
        where: { id: byName.id },
        data: { slug, name },
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

async function moveShellsBySourceUrl(
  fromModelId: string,
  toModelId: string,
  shellSourceUrls: Set<string>
) {
  if (fromModelId === toModelId) return 0;

  const shells = await prisma.shell.findMany({
    where: { deviceModelId: fromModelId, sourceName: "TamaShell" },
  });

  let moved = 0;
  for (const shell of shells) {
    if (!shell.sourceUrl || !shellSourceUrls.has(shell.sourceUrl)) continue;

    const conflict = await prisma.shell.findFirst({
      where: {
        deviceModelId: toModelId,
        slug: shell.slug,
        NOT: { id: shell.id },
      },
    });

    if (conflict) {
      await prisma.shell.delete({ where: { id: shell.id } });
      continue;
    }

    await prisma.shell.update({
      where: { id: shell.id },
      data: { deviceModelId: toModelId },
    });
    moved++;
  }

  return moved;
}

/**
 * Restructure imported TamaShell devices so each page section is its own device.
 * Moves shells from legacy combined models and removes empty device types.
 */
export async function restructureTamaShellDevices(options?: {
  skipNetwork?: boolean;
}): Promise<RestructureTamaShellResult> {
  if (options?.skipNetwork) {
    return {
      devicesCreated: 0,
      devicesRenamed: 0,
      shellsMoved: 0,
      devicesRemoved: 0,
    };
  }

  let devicesCreated = 0;
  let devicesRenamed = 0;
  let shellsMoved = 0;
  let devicesRemoved = 0;

  for (const entry of TAMASHELL_CATALOG) {
    const familyRecord = await prisma.deviceFamily.findUnique({
      where: { slug: FAMILY_SLUG_MAP[entry.family] },
    });
    if (!familyRecord) continue;

    try {
      const pageUrl = `https://www.tamashell.com/${entry.slug}`;
      const html = await fetchTamaShellPage(`/${entry.slug}`);
      const sections = parseShellSectionsFromHtml(html, pageUrl, entry.name, entry.slug);
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

        const sourceUrls = new Set(
          section.shells.map((shell) => shell.sourceUrl).filter(Boolean) as string[]
        );

        const legacyModels = await prisma.deviceModel.findMany({
          where: {
            OR: [
              { slug: entry.slug },
              { slug: { startsWith: `${entry.slug}-` } },
              {
                name: { equals: entry.name, mode: "insensitive" },
                familyId: familyRecord.id,
              },
            ],
          },
        });

        for (const legacy of legacyModels) {
          shellsMoved += await moveShellsBySourceUrl(legacy.id, model.id, sourceUrls);
        }
      }

      const legacyModels = await prisma.deviceModel.findMany({
        where: {
          familyId: familyRecord.id,
          OR: [
            { slug: entry.slug },
            { slug: { startsWith: `${entry.slug}-` } },
            { name: { equals: entry.name, mode: "insensitive" } },
          ],
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
    shellsMoved,
    devicesRemoved,
  };
}
