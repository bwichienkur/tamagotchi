import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Public catalog data — safe to cache across requests. */
export const getDeviceFamiliesWithModels = unstable_cache(
  async () =>
    prisma.deviceFamily.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        deviceModels: {
          include: {
            _count: { select: { shells: true } },
            shells: {
              take: 1,
              orderBy: { name: "asc" },
              select: { primaryImage: true },
            },
          },
          orderBy: { releaseYear: "asc" },
        },
      },
    }),
  ["device-families-with-models"],
  { revalidate: 60, tags: ["device-catalog"] }
);

export const getAllDeviceModels = unstable_cache(
  async () =>
    prisma.deviceModel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ["all-device-models"],
  { revalidate: 60, tags: ["device-catalog"] }
);

export const getAllFamilies = unstable_cache(
  async () =>
    prisma.deviceFamily.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ["all-families"],
  { revalidate: 60, tags: ["device-catalog"] }
);
