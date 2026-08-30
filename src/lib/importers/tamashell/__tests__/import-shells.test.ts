import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    deviceModel: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    shell: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  importMissingTamaShellShells,
  moveMatchingTamaShellShells,
} from "../import-shells";

describe("importMissingTamaShellShells", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.deviceModel.findUniqueOrThrow.mockResolvedValue({
      id: "device-1",
      heroImage: null,
    });
    prismaMock.shell.findMany.mockResolvedValue([]);
    prismaMock.shell.create.mockResolvedValue({});
  });

  it("creates shells that are not already on the device", async () => {
    const imported = await importMissingTamaShellShells("device-1", [
      {
        name: "Extellatchi",
        imageUrl: "https://example.com/extellatchi.jpg",
        sourceUrl: "https://www.tamashell.com/licensed",
        deviceName: "Tamagotchi Nanos Eevee",
      },
    ]);

    expect(imported).toBe(1);
    expect(prismaMock.shell.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deviceModelId: "device-1",
          name: "Extellatchi",
          sourceName: "TamaShell",
        }),
      })
    );
  });

  it("skips shells that already exist on the device", async () => {
    prismaMock.shell.findMany.mockResolvedValue([
      { id: "shell-1", name: "Extellatchi", alternateNames: [] },
    ]);

    const imported = await importMissingTamaShellShells("device-1", [
      {
        name: "Extellatchi",
        sourceUrl: "https://www.tamashell.com/licensed",
        deviceName: "Tamagotchi Nanos Eevee",
      },
    ]);

    expect(imported).toBe(0);
    expect(prismaMock.shell.create).not.toHaveBeenCalled();
  });
});

describe("moveMatchingTamaShellShells", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.shell.findMany.mockResolvedValue([]);
    prismaMock.shell.findFirst.mockResolvedValue(null);
    prismaMock.shell.update.mockResolvedValue({});
  });

  it("moves shells by normalized name from legacy models", async () => {
    prismaMock.shell.findMany.mockResolvedValue([
      {
        id: "shell-legacy",
        name: "Extellatchi",
        slug: "extellatchi",
        deviceModelId: "legacy-1",
      },
    ]);

    const moved = await moveMatchingTamaShellShells(
      "device-1",
      [
        {
          name: "Extellatchi",
          sourceUrl: "https://www.tamashell.com/licensed",
          deviceName: "Tamagotchi Nanos Eevee",
        },
      ],
      ["legacy-1"]
    );

    expect(moved).toBe(1);
    expect(prismaMock.shell.update).toHaveBeenCalledWith({
      where: { id: "shell-legacy" },
      data: { deviceModelId: "device-1" },
    });
  });
});
