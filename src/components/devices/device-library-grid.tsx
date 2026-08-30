import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";

interface DeviceLibraryModel {
  id: string;
  name: string;
  slug: string;
  releaseYear?: number | null;
  heroImage?: string | null;
  shells: Array<{ primaryImage: string | null }>;
  _count: { shells: number };
}

interface DeviceLibraryGridProps {
  models: DeviceLibraryModel[];
  ownedByModel: Record<string, number>;
}

export function DeviceLibraryGrid({ models, ownedByModel }: DeviceLibraryGridProps) {
  const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedModels.map((model) => {
        const ownedCount = ownedByModel[model.id] ?? 0;
        const imageUrl = model.heroImage ?? model.shells[0]?.primaryImage ?? null;

        return (
          <Link key={model.id} href={`/devices/${model.slug}`}>
            <Card className="cute-card h-full">
              {imageUrl ? (
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10 p-2">
                  <RemoteImage
                    src={imageUrl}
                    alt={model.name}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10" />
              )}
              <CardContent className="pt-4">
                <h4 className="font-display font-bold text-stone-900">{model.name}</h4>
                <p className="text-sm text-stone-500">{model.releaseYear ?? "—"}</p>
                <p className="mt-1 text-xs text-stone-400">
                  {model._count.shells} known shells
                </p>
                {ownedCount > 0 && (
                  <p className="mt-2 text-xs font-medium text-tama-cyan">
                    ✓ Owned{ownedCount > 1 ? ` × ${ownedCount}` : ""}
                  </p>
                )}
                <span className="mt-2 inline-block text-sm text-tama-cyan">
                  View Device →
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
