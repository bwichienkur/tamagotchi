import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { ManageNav } from "@/components/manage/manage-nav";
import { ShellsManager } from "@/components/manage/shells-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ManageShellsPage() {
  await requireAuth();

  const deviceModels = await prisma.deviceModel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Shells</h1>
      <p className="mb-8 text-stone-500">
        Manage shells for each device type, including colorways you add yourself.
      </p>

      <ManageNav />

      <Card>
        <CardHeader>
          <CardTitle>Shell Library</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          {deviceModels.length === 0 ? (
            <p className="text-sm text-stone-500">
              Add a device type first before creating shells.
            </p>
          ) : (
            <ShellsManager deviceModels={deviceModels} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
