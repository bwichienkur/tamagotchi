import { createSlug, normalizeName } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import type { TamaShellShell } from "./index";

async function findExistingShell(shellName: string, deviceModelId: string) {
  const normalized = normalizeName(shellName);
  const shells = await prisma.shell.findMany({ where: { deviceModelId } });

  return shells.find(
    (shell) =>
      normalizeName(shell.name) === normalized ||
      shell.alternateNames.some((alt) => normalizeName(alt) === normalized) ||
      (shell.sourceUrl && shellName && shell.sourceUrl.includes(createSlug(shellName)))
  );
}

/** Create TamaShell shells on a device when they are not already present. */
export async function importMissingTamaShellShells(
  deviceModelId: string,
  scrapedShells: TamaShellShell[]
): Promise<number> {
  if (scrapedShells.length === 0) return 0;

  const deviceModel = await prisma.deviceModel.findUniqueOrThrow({
    where: { id: deviceModelId },
  });

  let imported = 0;
  let heroImage = deviceModel.heroImage;

  for (const shell of scrapedShells) {
    const name = shell.name.trim();
    const existing = await findExistingShell(name, deviceModelId);
    if (existing) {
      if (!existing.primaryImage && shell.imageUrl) {
        await prisma.shell.update({
          where: { id: existing.id },
          data: { primaryImage: shell.imageUrl, lastCheckedAt: new Date() },
        });
      }
      continue;
    }

    await prisma.shell.create({
      data: {
        deviceModelId,
        name,
        slug: createSlug(name),
        primaryImage: shell.imageUrl,
        sourceUrl: shell.sourceUrl,
        sourceName: "TamaShell",
        importedAt: new Date(),
        lastCheckedAt: new Date(),
      },
    });
    imported++;
    if (!heroImage && shell.imageUrl) {
      heroImage = shell.imageUrl;
    }
  }

  if (heroImage && heroImage !== deviceModel.heroImage) {
    await prisma.deviceModel.update({
      where: { id: deviceModelId },
      data: { heroImage },
    });
  }

  return imported;
}

/** Move TamaShell shells from other models when names match a section scrape. */
export async function moveMatchingTamaShellShells(
  toModelId: string,
  scrapedShells: TamaShellShell[],
  fromModelIds: string[]
): Promise<number> {
  if (scrapedShells.length === 0 || fromModelIds.length === 0) return 0;

  const targetNames = new Set(scrapedShells.map((shell) => normalizeName(shell.name.trim())));
  let moved = 0;

  for (const fromModelId of fromModelIds) {
    if (fromModelId === toModelId) continue;

    const shells = await prisma.shell.findMany({
      where: { deviceModelId: fromModelId, sourceName: "TamaShell" },
    });

    for (const shell of shells) {
      if (!targetNames.has(normalizeName(shell.name))) continue;

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
  }

  return moved;
}
