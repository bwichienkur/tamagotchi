import Link from "next/link";
import { Layers, Library, Palette } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { ManageNav } from "@/components/manage/manage-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ManagePage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Manage Library</h1>
      <p className="mb-8 text-stone-500">
        Organize device types, series, and shells used across your collection.
      </p>

      <ManageNav />

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/manage/device-types">
          <Card className="cute-card h-full transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5 text-tama-cyan" />
                Device Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-500">
                Add, rename, or remove Tamagotchi models used when building your collection.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/manage/series">
          <Card className="cute-card h-full transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-tama-cyan" />
                Series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-500">
                Manage series labels within each family, like Gen 1 or licensed franchises.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/manage/shells">
          <Card className="cute-card h-full transition-transform hover:-translate-y-0.5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-tama-pink" />
                Shells
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-500">
                Manage shell colorways for each device type, including shells you create yourself.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
