"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Grid3X3, List, Plus } from "lucide-react";
import { CollectionCard } from "@/components/collection/collection-card";
import { CollectionHero } from "@/components/collection/collection-hero";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getConditionLabel } from "@/lib/condition-labels";

interface CollectionDevice {
  id: string;
  slug: string;
  nickname?: string | null;
  primaryPhoto?: string | null;
  photoFrames?: unknown;
  conditionBadge: "NONE" | "NIB" | "IOB";
  showMoreInfo?: string | null;
  favorite: boolean;
  currentlyRunning: boolean;
  purchaseDate?: Date | string | null;
  purchasePrice?: number | null;
  deviceModel: {
    id: string;
    name: string;
    releaseYear?: number | null;
    family?: { id: string; name: string } | null;
  };
  shell?: { id: string; name: string; region?: string | null } | null;
  customShellName?: string | null;
}

interface CollectionPageClientProps {
  devices: CollectionDevice[];
  families: Array<{ id: string; name: string }>;
  deviceModels: Array<{ id: string; name: string }>;
  stats: { total: number; deviceTypes: number; shells: number; nib: number };
  collectionImage?: string | null;
}

type SortOption =
  | "recent"
  | "name"
  | "release"
  | "purchase"
  | "price"
  | "shell";

export function CollectionPageClient({
  devices,
  families,
  deviceModels,
  stats,
  collectionImage,
}: CollectionPageClientProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [runningOnly, setRunningOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("recent");

  const filtered = useMemo(() => {
    let result = [...devices];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.deviceModel.name.toLowerCase().includes(q) ||
          d.shell?.name.toLowerCase().includes(q) ||
          d.customShellName?.toLowerCase().includes(q) ||
          d.nickname?.toLowerCase().includes(q)
      );
    }

    if (familyFilter) {
      result = result.filter((d) => d.deviceModel.family?.id === familyFilter);
    }

    if (modelFilter) {
      result = result.filter((d) => d.deviceModel.id === modelFilter);
    }

    if (conditionFilter) {
      result = result.filter((d) => d.conditionBadge === conditionFilter);
    }

    if (favoritesOnly) {
      result = result.filter((d) => d.favorite);
    }

    if (runningOnly) {
      result = result.filter((d) => d.currentlyRunning);
    }

    result.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.deviceModel.name.localeCompare(b.deviceModel.name);
        case "release":
          return (b.deviceModel.releaseYear ?? 0) - (a.deviceModel.releaseYear ?? 0);
        case "purchase":
          return (
            new Date(b.purchaseDate ?? 0).getTime() -
            new Date(a.purchaseDate ?? 0).getTime()
          );
        case "price":
          return (b.purchasePrice ?? 0) - (a.purchasePrice ?? 0);
        case "shell":
          return (a.shell?.name ?? "").localeCompare(b.shell?.name ?? "");
        default:
          return 0;
      }
    });

    return result;
  }, [
    devices,
    search,
    familyFilter,
    modelFilter,
    conditionFilter,
    favoritesOnly,
    runningOnly,
    sort,
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="My Collection"
        subtitle={`${stats.total} devices · ${stats.deviceTypes} types · ${stats.shells} shells · ${stats.nib} NIB`}
        actions={
          <Link href="/collection/add">
            <Button className="rounded-full">
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </Link>
        }
      />

      <CollectionHero initialImage={collectionImage} />

      <div className="cute-card mb-6 space-y-4 p-4">
        <Input
          placeholder="Search collection..."
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
            <option value="">All Device Types</option>
            {deviceModels.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
          >
            <option value="">All Conditions</option>
            <option value="NIB">NIB</option>
            <option value="IOB">IOB</option>
            <option value="NONE">{getConditionLabel("NONE")}</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
          >
            <option value="recent">Recently Added</option>
            <option value="name">Device Name</option>
            <option value="release">Release Date</option>
            <option value="purchase">Purchase Date</option>
            <option value="price">Price</option>
            <option value="shell">Shell Name</option>
          </select>
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm",
              favoritesOnly ? "border-tama-pink bg-tama-pink/10 text-tama-pink" : "border-stone-200"
            )}
          >
            Favorites
          </button>
          <button
            type="button"
            onClick={() => setRunningOnly(!runningOnly)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm",
              runningOnly ? "border-tama-cyan bg-tama-cyan/10 text-tama-cyan" : "border-stone-200"
            )}
          >
            Running
          </button>
        </div>
        <div className="flex justify-end gap-1">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="cute-card rounded-2xl border-2 border-dashed border-tama-pink/30 bg-tama-pink/5 py-16 text-center">
          <p className="text-4xl" aria-hidden>🥚</p>
          <p className="mt-2 font-display font-bold text-stone-700">No devices yet!</p>
          <p className="text-sm text-stone-500">Time to add your first Tamagotchi</p>
          <Link href="/collection/add" className="mt-4 inline-block">
            <Button>Add your first Tamagotchi</Button>
          </Link>
        </div>
      ) : (
        <div
          className={cn(
            view === "grid"
              ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5"
              : "space-y-3"
          )}
        >
          {filtered.map((device) => (
            <CollectionCard key={device.id} device={device} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}
