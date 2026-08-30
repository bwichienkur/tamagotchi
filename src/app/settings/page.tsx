import { requireAuth } from "@/lib/session";
import { DeviceTypesManager } from "@/components/settings/device-types-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await requireAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Settings</h1>
      <p className="mb-8 text-stone-500">
        Manage your account, device types, and collection data.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500">Signed in as</p>
          <p className="font-medium">{session.user.email}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Device Types</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <p className="mb-4 text-sm text-stone-500">
            Add, rename, or remove device types used when building your collection.
          </p>
          <DeviceTypesManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Portability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-stone-500">
            Export your collection data for backup or migration.
          </p>
          <div className="flex gap-2">
            <a href="/api/export?format=json">
              <Button variant="outline">Export JSON</Button>
            </a>
            <a href="/api/export?format=csv">
              <Button variant="outline">Export CSV</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
