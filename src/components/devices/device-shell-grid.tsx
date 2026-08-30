import Link from "next/link";
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
          <div key={shell.id} className="cute-card overflow-hidden">
            <Link href={`/devices/${deviceSlug}/shells/${shell.slug}`}>
              <div className="relative aspect-square bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10 p-3">
                <div className="relative h-full w-full overflow-hidden rounded-2xl ring-2 ring-white/90">
                  <RemoteImage
                    src={shell.primaryImage ?? "/placeholder-device.svg"}
                    alt={shell.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                {shell.ownedCount != null && shell.ownedCount > 0 && (
                  <div className="absolute left-5 top-5 rounded-full bg-gradient-to-r from-tama-cyan to-tama-mint px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    ✓ Owned{shell.ownedCount > 1 ? ` × ${shell.ownedCount}` : ""}
                  </div>
                )}
              </div>
            </Link>
            <div className="p-4">
              <h3 className="font-display font-bold text-stone-900">{shell.name}</h3>
              {(shell.region || shell.year) && (
                <p className="mt-1 text-xs text-stone-400">
                  {[shell.region, shell.year].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
