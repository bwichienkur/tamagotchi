"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ShellData {
  id: string;
  name: string;
  slug: string;
  primaryImage?: string | null;
  region?: string | null;
  year?: number | null;
  wave?: string | null;
  deviceModel: {
    id: string;
    name: string;
    slug: string;
    generation?: string | null;
    family?: { id: string; name: string; slug: string } | null;
  };
  ownedCount: number;
  wishlisted: boolean;
}

interface ShellCatalogClientProps {
  shells: ShellData[];
  families: Array<{ id: string; name: string; slug: string }>;
  deviceModels: Array<{ id: string; name: string }>;
}

export function ShellCatalogClient({
  shells,
  families,
  deviceModels,
}: ShellCatalogClientProps) {
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [ownedFilter, setOwnedFilter] = useState<"" | "owned" | "not-owned">("");

  const regions = useMemo(
    () => [...new Set(shells.map((s) => s.region).filter(Boolean))] as string[],
    [shells]
  );

  const years = useMemo(
    () => [...new Set(shells.map((s) => s.year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0)),
    [shells]
  );

  const filtered = useMemo(() => {
    return shells.filter((shell) => {
      if (search && !shell.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (familyFilter && shell.deviceModel.family?.id !== familyFilter) return false;
      if (modelFilter && shell.deviceModel.id !== modelFilter) return false;
      if (regionFilter && shell.region !== regionFilter) return false;
      if (yearFilter && shell.year?.toString() !== yearFilter) return false;
      if (ownedFilter === "owned" && shell.ownedCount === 0) return false;
      if (ownedFilter === "not-owned" && shell.ownedCount > 0) return false;
      return true;
    });
  }, [shells, search, familyFilter, modelFilter, regionFilter, yearFilter, ownedFilter]);

  const toggleWishlist = async (shellId: string) => {
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shellId }),
    });
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Shell Catalog</h1>
        <p className="mt-1 text-stone-500">
          Visual database of Tamagotchi shells and colorways
        </p>
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
        <Input
          placeholder="Search shells..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
          >
            <option value="">All Families</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
          >
            <option value="">All Devices</option>
            {deviceModels.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y!.toString()}>{y}</option>
            ))}
          </select>
          <select
            value={ownedFilter}
            onChange={(e) => setOwnedFilter(e.target.value as "" | "owned" | "not-owned")}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="owned">Owned</option>
            <option value="not-owned">Not Owned</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((shell) => (
          <div
            key={shell.id}
            className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <Link href={`/devices/${shell.deviceModel.slug}/shells/${shell.slug}`}>
              <div className="relative aspect-square bg-gradient-to-br from-stone-50 to-stone-100">
                <Image
                  src={shell.primaryImage ?? "/placeholder-device.svg"}
                  alt={shell.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {shell.ownedCount > 0 && (
                  <div className="absolute left-3 top-3 rounded-full bg-tama-cyan px-2 py-0.5 text-xs font-bold text-white">
                    ✓ Owned{shell.ownedCount > 1 ? ` × ${shell.ownedCount}` : ""}
                  </div>
                )}
              </div>
            </Link>
            <div className="p-4">
              <Link href={`/devices/${shell.deviceModel.slug}/shells/${shell.slug}`}>
                <h3 className="font-semibold text-stone-900 hover:text-tama-cyan">
                  {shell.name}
                </h3>
              </Link>
              <p className="text-sm text-stone-500">{shell.deviceModel.name}</p>
              <p className="text-xs text-stone-400">
                {[shell.region, shell.year].filter(Boolean).join(" • ")}
              </p>
              <div className="mt-3 flex items-center justify-between">
                {shell.ownedCount === 0 ? (
                  <Link href="/collection/add">
                    <Button size="sm" variant="outline">Add to Collection</Button>
                  </Link>
                ) : (
                  <span className="text-xs font-medium text-tama-cyan">In collection</span>
                )}
                <button
                  type="button"
                  onClick={() => toggleWishlist(shell.id)}
                  className={cn(
                    "rounded-full p-1.5 transition-colors",
                    shell.wishlisted ? "text-tama-pink" : "text-stone-300 hover:text-tama-pink"
                  )}
                >
                  <Heart className={cn("h-4 w-4", shell.wishlisted && "fill-current")} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
