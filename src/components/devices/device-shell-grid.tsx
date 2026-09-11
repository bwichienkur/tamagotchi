"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";
import { ShellWishlistButton } from "@/components/shells/shell-wishlist-button";

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
  wishlistedShellIds?: string[];
}

export function DeviceShellGrid({
  deviceSlug,
  shells,
  wishlistedShellIds = [],
}: DeviceShellGridProps) {
  if (shells.length === 0) return null;

  const wishlistedSet = new Set(wishlistedShellIds);

  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-2xl font-bold text-stone-800">
        Shells ({shells.length})
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {shells.map((shell) => (
          <Card key={shell.id} className="cute-card group relative h-full overflow-hidden">
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10">
              <Link
                href={`/devices/${deviceSlug}/shells/${shell.slug}`}
                className="block h-full w-full"
              >
                <RemoteImage
                  src={shell.primaryImage ?? "/placeholder-device.svg"}
                  alt={shell.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 25vw"
                />
              </Link>
              <ShellWishlistButton
                shellId={shell.id}
                initialWishlisted={wishlistedSet.has(shell.id)}
              />
              {shell.ownedCount != null && shell.ownedCount > 0 && (
                <div className="absolute left-1.5 top-1.5 rounded-full bg-gradient-to-r from-tama-cyan to-tama-mint px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:left-2 sm:top-2 sm:text-xs">
                  ✓ Owned{shell.ownedCount > 1 ? ` × ${shell.ownedCount}` : ""}
                </div>
              )}
            </div>
            <CardContent className="p-2 pt-2 sm:p-4 sm:pt-3">
              <Link href={`/devices/${deviceSlug}/shells/${shell.slug}`}>
                <h3 className="line-clamp-2 font-display text-xs font-bold leading-tight text-stone-900 hover:text-tama-cyan sm:text-sm">
                  {shell.name}
                </h3>
              </Link>
              {(shell.region || shell.year) && (
                <p className="mt-0.5 text-[10px] text-stone-400 sm:text-xs">
                  {[shell.region, shell.year].filter(Boolean).join(" · ")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
