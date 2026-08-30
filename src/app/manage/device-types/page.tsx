import { requireAuth } from "@/lib/session";
import { getAllFamilies } from "@/lib/cached-data";
import { ManageNav } from "@/components/manage/manage-nav";
import { DeviceTypesManager } from "@/components/settings/device-types-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ManageDeviceTypesPage() {
  await requireAuth();
  const families = await getAllFamilies();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Device Types</h1>
      <p className="mb-8 text-stone-500">
        Add, rename, or remove device types used when building your collection.
      </p>

      <ManageNav />

      <Card>
        <CardHeader>
          <CardTitle>Device Type Library</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <DeviceTypesManager families={families} />
        </CardContent>
      </Card>
    </div>
  );
}
