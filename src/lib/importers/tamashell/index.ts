import { normalizeName, createSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import {
  FAMILY_SLUG_MAP,
  TAMASHELL_CATALOG,
  type TamaShellCatalogEntry,
} from "./catalog";
import { fetchTamaShellPage, parseShellsFromHtml } from "./scraper";

export interface TamaShellDevice {
  name: string;
  url: string;
  slug: string;
  family?: string;
}

export interface TamaShellShell {
  name: string;
  imageUrl?: string;
  region?: string;
  wave?: string;
  year?: number;
  sourceUrl: string;
  deviceName: string;
}

export interface ImportPreviewItem {
  deviceName: string;
  deviceUrl?: string;
  family?: string;
  newShells: TamaShellShell[];
  existingShells: TamaShellShell[];
  possibleDuplicates: Array<{
    imported: TamaShellShell;
    existing: { id: string; name: string; deviceModelName: string };
  }>;
  possibleDeviceMatch?: {
    imported: string;
    existing: { id: string; name: string };
  };
}

export interface ImportPreview {
  items: ImportPreviewItem[];
  scannedAt: string;
  source: string;
}

export interface ImportAllResult {
  devices: number;
  shells: number;
  skipped: number;
}

export class TamaShellImporter {
  private rateLimitMs = 400;
  private lastRequest = 0;

  async getDeviceFamilies(): Promise<string[]> {
    return Object.keys(FAMILY_SLUG_MAP);
  }

  async getDevices(): Promise<TamaShellDevice[]> {
    return TAMASHELL_CATALOG.map((entry) => ({
      name: entry.name,
      slug: entry.slug,
      url: `https://www.tamashell.com/${entry.slug}`,
      family: entry.family,
    }));
  }

  async getShells(device: TamaShellDevice | string): Promise<TamaShellShell[]> {
    const entry =
      typeof device === "string"
        ? TAMASHELL_CATALOG.find((d) => d.name === device || d.slug === device)
        : TAMASHELL_CATALOG.find((d) => d.slug === device.slug || d.name === device.name);

    if (!entry) return [];

    await this.respectRateLimit();
    const html = await fetchTamaShellPage(`/${entry.slug}`);
    return parseShellsFromHtml(html, `https://www.tamashell.com/${entry.slug}`, entry.name);
  }

  normalizeShell(shell: TamaShellShell): TamaShellShell {
    return {
      ...shell,
      name: shell.name.trim(),
    };
  }

  async findPossibleDeviceMatch(deviceName: string) {
    const normalized = normalizeName(deviceName);
    const models = await prisma.deviceModel.findMany();

    for (const model of models) {
      if (normalizeName(model.name) === normalized) {
        return { id: model.id, name: model.name };
      }
      for (const alt of model.alternateNames) {
        if (normalizeName(alt) === normalized) {
          return { id: model.id, name: model.name };
        }
      }
    }

    const fuzzy = models.find((m) => {
      const modelNorm = normalizeName(m.name);
      return modelNorm.includes(normalized) || normalized.includes(modelNorm);
    });

    return fuzzy ? { id: fuzzy.id, name: fuzzy.name } : undefined;
  }

  async findPossibleShellMatch(shellName: string, deviceModelId: string) {
    const normalized = normalizeName(shellName);
    const shells = await prisma.shell.findMany({ where: { deviceModelId } });

    return shells.find(
      (s) =>
        normalizeName(s.name) === normalized ||
        s.alternateNames.some((a) => normalizeName(a) === normalized) ||
        (s.sourceUrl && shellName && s.sourceUrl.includes(createSlug(shellName)))
    );
  }

  private async resolveDeviceModel(entry: TamaShellCatalogEntry) {
    const existing = await this.findPossibleDeviceMatch(entry.name);
    if (existing) {
      return prisma.deviceModel.findUniqueOrThrow({ where: { id: existing.id } });
    }

    const familySlug = FAMILY_SLUG_MAP[entry.family];
    const family = await prisma.deviceFamily.findUnique({ where: { slug: familySlug } });
    if (!family) {
      throw new Error(`Device family not found: ${familySlug}`);
    }

    return prisma.deviceModel.create({
      data: {
        name: entry.name,
        slug: createSlug(entry.name),
        familyId: family.id,
        manufacturer: "Bandai",
      },
    });
  }

  async importAll(): Promise<ImportAllResult> {
    let devices = 0;
    let shells = 0;
    let skipped = 0;

    for (const entry of TAMASHELL_CATALOG) {
      try {
        const deviceModel = await this.resolveDeviceModel(entry);
        devices++;

        const existingTamaShellCount = await prisma.shell.count({
          where: { deviceModelId: deviceModel.id, sourceName: "TamaShell" },
        });

        if (
          existingTamaShellCount > 0 &&
          process.env.FORCE_TAMASHELL_RESCRAPE !== "true"
        ) {
          skipped += existingTamaShellCount;
          continue;
        }

        const scrapedShells = await this.getShells({
          name: entry.name,
          slug: entry.slug,
          url: `https://www.tamashell.com/${entry.slug}`,
          family: entry.family,
        });

        let heroImage: string | null = deviceModel.heroImage;
        for (const shell of scrapedShells) {
          const normalized = this.normalizeShell(shell);
          const existing = await this.findPossibleShellMatch(normalized.name, deviceModel.id);
          if (existing) {
            if (!existing.primaryImage && normalized.imageUrl) {
              await prisma.shell.update({
                where: { id: existing.id },
                data: { primaryImage: normalized.imageUrl, lastCheckedAt: new Date() },
              });
            }
            skipped++;
            continue;
          }

          await prisma.shell.create({
            data: {
              deviceModelId: deviceModel.id,
              name: normalized.name,
              slug: createSlug(normalized.name),
              primaryImage: normalized.imageUrl,
              sourceUrl: normalized.sourceUrl,
              sourceName: "TamaShell",
              importedAt: new Date(),
              lastCheckedAt: new Date(),
            },
          });
          shells++;
          if (!heroImage && normalized.imageUrl) {
            heroImage = normalized.imageUrl;
          }
        }

        if (heroImage && heroImage !== deviceModel.heroImage) {
          await prisma.deviceModel.update({
            where: { id: deviceModel.id },
            data: { heroImage },
          });
        }
      } catch (error) {
        console.error(`TamaShell import failed for ${entry.name}:`, error);
      }
    }

    await prisma.importLog.create({
      data: {
        source: "TamaShell",
        action: "import_all",
        details: { devices, shells, skipped },
      },
    });

    return { devices, shells, skipped };
  }

  async scan(): Promise<ImportPreview> {
    const devices = await this.getDevices();
    const items: ImportPreviewItem[] = [];

    for (const device of devices) {
      const shells = await this.getShells(device);
      const deviceMatch = await this.findPossibleDeviceMatch(device.name);

      let deviceModelId = deviceMatch?.id;
      if (!deviceModelId) {
        const created = await prisma.deviceModel.findFirst({
          where: { name: { equals: device.name, mode: "insensitive" } },
        });
        deviceModelId = created?.id;
      }

      const newShells: TamaShellShell[] = [];
      const existingShells: TamaShellShell[] = [];
      const possibleDuplicates: ImportPreviewItem["possibleDuplicates"] = [];

      for (const shell of shells) {
        const normalized = this.normalizeShell(shell);
        if (deviceModelId) {
          const match = await this.findPossibleShellMatch(normalized.name, deviceModelId);
          if (match) {
            if (normalizeName(match.name) === normalizeName(normalized.name)) {
              existingShells.push(normalized);
            } else {
              possibleDuplicates.push({
                imported: normalized,
                existing: {
                  id: match.id,
                  name: match.name,
                  deviceModelName: device.name,
                },
              });
            }
          } else {
            newShells.push(normalized);
          }
        } else {
          newShells.push(normalized);
        }
      }

      items.push({
        deviceName: device.name,
        deviceUrl: device.url,
        family: device.family,
        newShells,
        existingShells,
        possibleDuplicates,
        possibleDeviceMatch: deviceMatch
          ? { imported: device.name, existing: deviceMatch }
          : undefined,
      });
    }

    await prisma.importLog.create({
      data: {
        source: "TamaShell",
        action: "scan",
        details: { deviceCount: devices.length },
      },
    });

    return {
      items,
      scannedAt: new Date().toISOString(),
      source: "TamaShell",
    };
  }

  async importSelected(
    selections: Array<{
      deviceName: string;
      family?: string;
      useExistingDeviceId?: string;
      shells: TamaShellShell[];
    }>
  ) {
    let imported = 0;
    let skipped = 0;

    for (const selection of selections) {
      let deviceModelId = selection.useExistingDeviceId;

      if (!deviceModelId) {
        const catalogEntry = TAMASHELL_CATALOG.find((d) => d.name === selection.deviceName);
        const familySlug = catalogEntry
          ? FAMILY_SLUG_MAP[catalogEntry.family]
          : createSlug(selection.family ?? "modern");

        const family = await prisma.deviceFamily.findFirst({
          where: { slug: familySlug },
        });
        const familyId = family?.id ?? (await prisma.deviceFamily.findFirst())!.id;

        const model = await prisma.deviceModel.create({
          data: {
            name: selection.deviceName,
            slug: createSlug(selection.deviceName),
            familyId,
          },
        });
        deviceModelId = model.id;
      }

      for (const shell of selection.shells) {
        const existing = await this.findPossibleShellMatch(shell.name, deviceModelId);
        if (existing) {
          skipped++;
          continue;
        }

        await prisma.shell.create({
          data: {
            deviceModelId,
            name: shell.name,
            slug: createSlug(shell.name),
            region: shell.region,
            year: shell.year,
            wave: shell.wave,
            primaryImage: shell.imageUrl,
            sourceUrl: shell.sourceUrl,
            sourceName: "TamaShell",
            importedAt: new Date(),
            lastCheckedAt: new Date(),
          },
        });
        imported++;
      }
    }

    await prisma.importLog.create({
      data: {
        source: "TamaShell",
        action: "import",
        details: { imported, skipped },
      },
    });

    return { imported, skipped };
  }

  private async respectRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    if (elapsed < this.rateLimitMs) {
      await new Promise((r) => setTimeout(r, this.rateLimitMs - elapsed));
    }
    this.lastRequest = Date.now();
  }
}
