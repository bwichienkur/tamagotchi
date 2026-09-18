import { AddDeviceForm } from "@/components/collection/add-device-form";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export default async function AddDevicePage({
  searchParams,
}: {
  searchParams: Promise<{
    deviceModelId?: string;
    shellId?: string;
    shellImage?: string;
  }>;
}) {
  await requireAuth();
  const params = await searchParams;

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

  let initialDeviceModelId = params.deviceModelId;
  let initialShellId = params.shellId;
  let initialShellName: string | undefined;
  let initialPrimaryPhoto = params.shellImage;

  if (initialShellId) {
    const shell = await prisma.shell.findUnique({
      where: { id: initialShellId },
      select: {
        id: true,
        name: true,
        deviceModelId: true,
        primaryImage: true,
      },
    });

    if (shell) {
      initialDeviceModelId = shell.deviceModelId;
      initialShellId = shell.id;
      initialShellName = shell.name;
      if (!initialPrimaryPhoto && shell.primaryImage) {
        initialPrimaryPhoto = shell.primaryImage;
      }
    } else {
      initialShellId = undefined;
    }
  }

  if (initialDeviceModelId && !models.some((model) => model.id === initialDeviceModelId)) {
    initialDeviceModelId = undefined;
    initialShellId = undefined;
    initialShellName = undefined;
  }

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
        initialDeviceModelId={initialDeviceModelId}
        initialShellId={initialShellId}
        initialShellName={initialShellName}
        initialPrimaryPhoto={initialPrimaryPhoto}
      />
    </div>
  );
}
