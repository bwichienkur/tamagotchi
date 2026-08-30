import { CollectionPageClient } from "@/components/collection/collection-page-client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { withDatabase } from "@/lib/db-query";
import { getAllDeviceModels, getAllFamilies } from "@/lib/cached-data";

export default async function CollectionPage() {
  const session = await requireAuth();

  const { devices, families, deviceModels, collectionImage } = await withDatabase(async () => {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collectionImage: true },
    });

    const devices = await prisma.ownedDevice.findMany({
      where: { userId: session.user.id },
      include: {
        deviceModel: { include: { family: true } },
        shell: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const families = await getAllFamilies();
    const deviceModels = await getAllDeviceModels();

    return { devices, families, deviceModels, collectionImage: user?.collectionImage };
  });

  const stats = {
    total: devices.length,
    deviceTypes: new Set(devices.map((d) => d.deviceModelId)).size,
    shells: new Set(devices.filter((d) => d.shellId).map((d) => d.shellId)).size,
    nib: devices.filter((d) => d.conditionBadge === "NIB").length,
  };

  return (
    <CollectionPageClient
      devices={devices}
      families={families}
      deviceModels={deviceModels}
      stats={stats}
      collectionImage={collectionImage}
    />
  );
}
