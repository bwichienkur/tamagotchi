import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";

export interface DeviceShellItem {
  id: string;
  name: string;
  slug: string;
  primaryImage?: string | null;
  region?: string | null;
  year?: number | null;
  ownedCount?: number;
}

interface DeviceShellGridProps {
  deviceSlug: string;
  shells: DeviceShellItem[];
}

export function DeviceShellGrid({ deviceSlug, shells }: DeviceShellGridProps) {
  if (shells.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-2xl font-bold text-stone-800">
        Shells ({shells.length})
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shells.map((shell) => (
          <Link key={shell.id} href={`/devices/${deviceSlug}/shells/${shell.slug}`}>
            <Card className="cute-card h-full">
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10 p-2">
                <RemoteImage
                  src={shell.primaryImage ?? "/placeholder-device.svg"}
                  alt={shell.name}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-display font-bold text-stone-900">{shell.name}</h3>
                {(shell.region || shell.year) && (
                  <p className="mt-1 text-xs text-stone-400">
                    {[shell.region, shell.year].filter(Boolean).join(" · ")}
                  </p>
                )}
                {shell.ownedCount != null && shell.ownedCount > 0 && (
                  <p className="mt-2 text-xs font-medium text-tama-cyan">
                    ✓ Owned{shell.ownedCount > 1 ? ` × ${shell.ownedCount}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
