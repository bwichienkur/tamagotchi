import { normalizeName } from "@/lib/slug";
import { prisma } from "@/lib/prisma";

export interface TamaShellDevice {
  name: string;
  url: string;
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

const DEMO_CATALOG: Record<string, { family: string; shells: TamaShellShell[] }> = {
  "Tamagotchi Connection Version 1": {
    family: "Connection",
    shells: [
      { name: "Pink with Ice Cream", region: "North America", year: 2004, sourceUrl: "https://www.tamashell.com/demo/pink-ice-cream", deviceName: "Tamagotchi Connection Version 1" },
      { name: "Blue with Stars", region: "Japan", year: 2004, sourceUrl: "https://www.tamashell.com/demo/blue-stars", deviceName: "Tamagotchi Connection Version 1" },
      { name: "Green Camouflage", region: "Europe", year: 2004, sourceUrl: "https://www.tamashell.com/demo/green-camo", deviceName: "Tamagotchi Connection Version 1" },
    ],
  },
  "Tamagotchi Connection v3": {
    family: "Connection",
    shells: [
      { name: "Blue Waves", region: "North America", year: 2006, sourceUrl: "https://www.tamashell.com/demo/blue-waves", deviceName: "Tamagotchi Connection v3" },
      { name: "Pink Hearts", region: "North America", year: 2006, sourceUrl: "https://www.tamashell.com/demo/pink-hearts", deviceName: "Tamagotchi Connection v3" },
    ],
  },
};

export class TamaShellImporter {
  private rateLimitMs = 1000;
  private lastRequest = 0;

  async getDeviceFamilies(): Promise<string[]> {
    return ["Vintage", "Connection", "Modern", "Classic Remakes"];
  }

  async getDevices(): Promise<TamaShellDevice[]> {
    await this.respectRateLimit();
    return Object.keys(DEMO_CATALOG).map((name) => ({
      name,
      url: `https://www.tamashell.com/device/${encodeURIComponent(name)}`,
      family: DEMO_CATALOG[name].family,
    }));
  }

  async getShells(deviceName: string): Promise<TamaShellShell[]> {
    await this.respectRateLimit();
    return DEMO_CATALOG[deviceName]?.shells ?? [];
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
        s.sourceUrl?.includes(shellName.toLowerCase().replace(/\s+/g, "-"))
    );
  }

  async scan(): Promise<ImportPreview> {
    const devices = await this.getDevices();
    const items: ImportPreviewItem[] = [];

    for (const device of devices) {
      const shells = await this.getShells(device.name);
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
        const family = await prisma.deviceFamily.findFirst({
          where: { name: { equals: selection.family ?? "Modern", mode: "insensitive" } },
        });
        const familyId =
          family?.id ??
          (await prisma.deviceFamily.findFirst())!.id;

        const { createSlug } = await import("@/lib/slug");
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

        const { createSlug } = await import("@/lib/slug");
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
