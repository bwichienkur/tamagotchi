import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    deviceFamily: { findUnique: vi.fn() },
    deviceModel: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
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
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/revalidate-catalog", () => ({
  revalidateDeviceCatalog: vi.fn(),
}));

import { consolidateLicensedNanosDevices } from "@/lib/consolidate-licensed-nanos";

describe("consolidateLicensedNanosDevices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.deviceFamily.findUnique.mockResolvedValue({ id: "family-1", slug: "modern" });
    prismaMock.deviceModel.findFirst.mockResolvedValue({
      id: "canonical-1",
      name: "Tamagotchi Nanos",
      slug: "tamagotchi-nanos",
    });
    prismaMock.shell.findMany.mockResolvedValue([]);
    prismaMock.shell.findFirst.mockResolvedValue(null);
    prismaMock.deviceModel.findMany.mockResolvedValue([
      {
        id: "section-1",
        name: "Tamagotchi Nanos Eevee",
        shells: [{ id: "shell-1", name: "Extellatchi", slug: "extellatchi", wave: null }],
      },
    ]);
    prismaMock.deviceModel.findUnique.mockResolvedValue({
      id: "section-1",
      _count: { shells: 0, ownedDevices: 0, wikiPages: 0 },
    });
    prismaMock.ownedDevice.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.wikiPage.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.shell.update.mockResolvedValue({});
    prismaMock.deviceModel.delete.mockResolvedValue({});
  });

  it("moves section shells onto the canonical Tamagotchi Nanos device", async () => {
    const result = await consolidateLicensedNanosDevices();

    expect(result.canonicalDeviceId).toBe("canonical-1");
    expect(result.shellsMoved).toBe(1);
    expect(prismaMock.shell.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "shell-1" },
        data: expect.objectContaining({
          deviceModelId: "canonical-1",
          wave: "Eevee",
        }),
      })
    );
  });
});
