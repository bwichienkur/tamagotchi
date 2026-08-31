import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    deviceFamily: { findUnique: vi.fn() },
    deviceModel: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    shell: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    ownedDevice: { updateMany: vi.fn() },
    wikiPage: { updateMany: vi.fn() },
    deviceProperty: { updateMany: vi.fn() },
    galleryImage: { updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/revalidate-catalog", () => ({
  revalidateDeviceCatalog: vi.fn(),
}));

import { consolidateTamagotchiNanoDevices } from "@/lib/consolidate-tamagotchi-nano";

describe("consolidateTamagotchiNanoDevices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.deviceFamily.findUnique.mockResolvedValue({ id: "family-1", slug: "modern" });
    prismaMock.deviceModel.findUnique.mockResolvedValue({
      id: "canonical-1",
      name: "Tamagotchi Nano",
      slug: "nano",
    });
    prismaMock.deviceModel.findFirst.mockResolvedValue(null);
    prismaMock.shell.findMany.mockResolvedValue([]);
    prismaMock.shell.findFirst.mockResolvedValue(null);
    prismaMock.deviceModel.findMany.mockResolvedValue([
      {
        id: "nanos-1",
        name: "Tamagotchi Nanos",
        slug: "tamagotchi-nanos",
        shells: [{ id: "shell-1", name: "Extellatchi", slug: "extellatchi", wave: "Eevee" }],
      },
      {
        id: "se-1",
        name: "Tamagotchi Nano Special Edition",
        slug: "nano-special-edition",
        shells: [{ id: "shell-2", name: "Gold", slug: "gold", wave: null }],
      },
    ]);
    prismaMock.deviceModel.findUnique.mockImplementation(({ where }: { where: { id?: string; slug?: string } }) => {
      if (where.slug === "nano") {
        return Promise.resolve({ id: "canonical-1", name: "Tamagotchi Nano", slug: "nano" });
      }
      if (where.id === "nanos-1" || where.id === "se-1") {
        return Promise.resolve({
          id: where.id,
          _count: { shells: 0, ownedDevices: 0, wikiPages: 0 },
        });
      }
      return Promise.resolve(null);
    });
    prismaMock.ownedDevice.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.wikiPage.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.deviceProperty.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.galleryImage.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.shell.update.mockResolvedValue({});
    prismaMock.deviceModel.delete.mockResolvedValue({});
  });

  it("merges Nanos and Special Edition shells onto Tamagotchi Nano", async () => {
    const result = await consolidateTamagotchiNanoDevices();

    expect(result.canonicalDeviceId).toBe("canonical-1");
    expect(result.shellsMoved).toBe(2);
    expect(prismaMock.shell.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "shell-2" },
        data: expect.objectContaining({
          deviceModelId: "canonical-1",
          wave: "Special Edition",
        }),
      })
    );
  });
});
