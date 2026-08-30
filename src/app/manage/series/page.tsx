import { requireAuth } from "@/lib/session";
import { getAllFamilies } from "@/lib/cached-data";
import { ManageNav } from "@/components/manage/manage-nav";
import { SeriesManager } from "@/components/manage/series-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ManageSeriesPage() {
  await requireAuth();
  const families = await getAllFamilies();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Series</h1>
      <p className="mb-8 text-stone-500">
        Manage series groupings within each family, such as Gen 1 or franchise labels.
      </p>

      <ManageNav />

      <Card>
        <CardHeader>
          <CardTitle>Series Library</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <SeriesManager families={families} />
        </CardContent>
      </Card>
    </div>
  );
}
