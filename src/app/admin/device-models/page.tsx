import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { Button } from "@/components/ui/button";

export default async function AdminDeviceModelsPage() {
  await requireAdmin();

  const models = await prisma.deviceModel.findMany({
    include: {
      family: true,
      _count: { select: { shells: true, ownedDevices: true, wikiPages: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Device Models</h1>
        <Link href="/admin">
          <Button variant="ghost" size="sm">← Admin</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Family</th>
              <th className="px-4 py-3 text-left font-medium">Release</th>
              <th className="px-4 py-3 text-left font-medium">Shells</th>
              <th className="px-4 py-3 text-left font-medium">Wiki</th>
              <th className="px-4 py-3 text-left font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.id} className="border-t border-stone-100">
                <td className="px-4 py-3">
                  <Link href={`/devices/${model.slug}`} className="text-tama-cyan hover:underline">
                    {model.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{model.family.name}</td>
                <td className="px-4 py-3">{model.releaseYear ?? "—"}</td>
                <td className="px-4 py-3">{model._count.shells}</td>
                <td className="px-4 py-3">{model._count.wikiPages > 0 ? "Yes" : "—"}</td>
                <td className="px-4 py-3">{model.updatedAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
