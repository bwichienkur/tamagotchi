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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {sortedModels.map((model) => {
        const ownedCount = ownedByModel[model.id] ?? 0;
        const imageUrl = model.heroImage ?? model.shells[0]?.primaryImage ?? null;

        return (
          <Link key={model.id} href={`/devices/${model.slug}`}>
            <Card className="cute-card h-full overflow-hidden">
              <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10">
                {imageUrl ? (
                  <RemoteImage
                    src={imageUrl}
                    alt={model.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10" />
                )}
              </div>
              <CardContent className="p-2 sm:p-2.5">
                <h4 className="line-clamp-2 font-display text-[11px] font-bold leading-tight text-stone-900 sm:text-xs">
                  {model.name}
                </h4>
                <p className="mt-0.5 text-[10px] text-stone-500 sm:text-[11px]">
                  {model.releaseYear ?? "—"}
                </p>
                <p className="mt-0.5 text-[10px] text-stone-400">
                  {model._count.shells} shells
                </p>
                {ownedCount > 0 && (
                  <p className="mt-1 text-[10px] font-medium text-tama-cyan">
                    ✓ Owned{ownedCount > 1 ? ` × ${ownedCount}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
