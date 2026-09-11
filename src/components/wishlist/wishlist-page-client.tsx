"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ShellWishlistButton } from "@/components/shells/shell-wishlist-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RemoteImage } from "@/components/ui/remote-image";

interface WishlistShellItem {
  id: string;
  shellId: string;
  notes?: string | null;
  shell: {
    id: string;
    name: string;
    slug: string;
    primaryImage?: string | null;
    region?: string | null;
    year?: number | null;
    deviceModel: {
      name: string;
      slug: string;
    };
  };
}

interface WishlistPageClientProps {
  initialItems: WishlistShellItem[];
}

export function WishlistPageClient({ initialItems }: WishlistPageClientProps) {
  const [items, setItems] = useState(initialItems);

  const removeItem = (shellId: string) => {
    setItems((prev) => prev.filter((item) => item.shellId !== shellId));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="My Wishlist"
        subtitle={
          items.length === 0
            ? "Save shells you want from the device library"
            : `${items.length} shell${items.length === 1 ? "" : "s"} saved`
        }
        actions={
          <Link href="/devices">
            <Button variant="outline" className="rounded-full">
              Browse Device Library
            </Button>
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="cute-card rounded-2xl border-2 border-dashed border-tama-pink/30 bg-tama-pink/5 py-16 text-center">
          <Heart className="mx-auto h-10 w-10 text-tama-pink/40" />
          <p className="mt-3 font-display font-bold text-stone-700">No wishlist items yet</p>
          <p className="mt-1 text-sm text-stone-500">
            Open a device in the library and tap the heart on any shell to save it here.
          </p>
          <Link href="/devices" className="mt-4 inline-block">
            <Button>Browse devices</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <Card key={item.id} className="cute-card relative h-full overflow-hidden">
              <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10">
                <Link
                  href={`/devices/${item.shell.deviceModel.slug}/shells/${item.shell.slug}`}
                  className="block h-full w-full"
                >
                  <RemoteImage
                    src={item.shell.primaryImage ?? "/placeholder-device.svg"}
                    alt={item.shell.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </Link>
                <ShellWishlistButton
                  shellId={item.shellId}
                  initialWishlisted
                  onToggle={(wishlisted) => {
                    if (!wishlisted) removeItem(item.shellId);
                  }}
                />
              </div>
              <CardContent className="p-2 sm:p-2.5">
                <Link
                  href={`/devices/${item.shell.deviceModel.slug}/shells/${item.shell.slug}`}
                  className="line-clamp-2 font-display text-[11px] font-bold leading-tight text-stone-900 hover:text-tama-cyan sm:text-xs"
                >
                  {item.shell.name}
                </Link>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-stone-500 sm:text-[11px]">
                  {item.shell.deviceModel.name}
                </p>
                {(item.shell.region || item.shell.year) && (
                  <p className="mt-0.5 text-[10px] text-stone-400">
                    {[item.shell.region, item.shell.year].filter(Boolean).join(" · ")}
                  </p>
                )}
                {item.notes && (
                  <p className="mt-1 line-clamp-2 text-[10px] text-stone-400">{item.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
