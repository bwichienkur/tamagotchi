import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { EditDeviceForm } from "@/components/collection/edit-device-form";
import { Button } from "@/components/ui/button";

export default async function EditDevicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireAuth();
  const { slug } = await params;

  const device = await prisma.ownedDevice.findFirst({
    where: { slug, userId: session.user.id },
    include: { deviceModel: true },
  });

  if (!device) notFound();

  const models = await prisma.deviceModel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link href={`/collection/${device.slug}`}>
          <Button variant="link" className="mb-2 h-auto p-0 text-sm">
            ← Back to device
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-stone-900">Edit Device</h1>
        <p className="mt-1 text-stone-500">
          Update details for your {device.deviceModel.name}
        </p>
      </div>
      <EditDeviceForm
        deviceModels={models.map((m) => ({ value: m.id, label: m.name }))}
        device={{
          slug: device.slug,
          deviceModelId: device.deviceModelId,
          nickname: device.nickname,
          primaryPhoto: device.primaryPhoto,
          additionalPhotos: device.additionalPhotos,
          conditionBadge: device.conditionBadge,
          conditionNotes: device.conditionNotes,
          showMoreInfo: device.showMoreInfo,
          purchaseDate: device.purchaseDate?.toISOString() ?? null,
          purchasePrice: device.purchasePrice,
          purchaseCurrency: device.purchaseCurrency,
          purchasedFrom: device.purchasedFrom,
          serialNumber: device.serialNumber,
          workingStatus: device.workingStatus,
          favorite: device.favorite,
          currentlyRunning: device.currentlyRunning,
          notes: device.notes,
        }}
      />
    </div>
  );
}
