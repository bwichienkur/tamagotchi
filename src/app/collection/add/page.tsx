import { AddDeviceForm } from "@/components/collection/add-device-form";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export default async function AddDevicePage() {
  await requireAuth();

  const [models, families] = await Promise.all([
    prisma.deviceModel.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, familyId: true },
    }),
    prisma.deviceFamily.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Add Device</h1>
        <p className="mt-1 text-stone-500">
          Add a new Tamagotchi to your collection
        </p>
      </div>
      <AddDeviceForm
        deviceModels={models.map((m) => ({
          value: m.id,
          label: m.name,
          familyId: m.familyId,
        }))}
        families={families}
      />
    </div>
  );
}
