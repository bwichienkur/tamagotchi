import { CollectionPageClient } from "@/components/collection/collection-page-client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { withDatabase } from "@/lib/db-query";

export default async function CollectionPage() {
  const session = await requireAuth();

  const { devices, families, deviceModels } = await withDatabase(async () => {
    const devices = await prisma.ownedDevice.findMany({
      where: { userId: session.user.id },
      include: {
        deviceModel: { include: { family: true } },
        shell: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const families = await prisma.deviceFamily.findMany({ orderBy: { sortOrder: "asc" } });
    const deviceModels = await prisma.deviceModel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return { devices, families, deviceModels };
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
    />
  );
}
