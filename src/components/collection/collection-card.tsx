"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";
import { ConditionBadge } from "@/components/collection/condition-badge";
import { RemoveDeviceButton } from "@/components/collection/remove-device-button";
import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils";

export interface CollectionCardData {
  id: string;
  slug: string;
  nickname?: string | null;
  primaryPhoto?: string | null;
  conditionBadge: "NONE" | "NIB" | "IOB";
  showMoreInfo?: string | null;
  favorite: boolean;
  deviceModel: { name: string };
  shell?: { name: string } | null;
  customShellName?: string | null;
}

interface CollectionCardProps {
  device: CollectionCardData;
  view?: "grid" | "list";
}

export function CollectionCard({ device, view = "grid" }: CollectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const shellName = device.shell?.name ?? device.customShellName ?? "Unknown shell";
  const imageSrc = device.primaryPhoto ?? "/placeholder-device.svg";

  if (view === "list") {
    return (
      <div className="group rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex gap-4">
          <Link href={`/collection/${device.slug}`} className="shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-stone-100">
              <RemoteImage
                src={imageSrc}
                alt={device.deviceModel.name}
                fill
                sizes="96px"
              />
            </div>
          </Link>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/collection/${device.slug}`}
                  className="font-semibold text-stone-900 hover:text-tama-cyan"
                >
                  {device.nickname ?? device.deviceModel.name}
                </Link>
                <p className="text-sm text-stone-500">{shellName}</p>
              </div>
              <div className="flex items-center gap-2">
                <ConditionBadge condition={device.conditionBadge} />
                {device.favorite && (
                  <Heart className="h-4 w-4 fill-tama-pink text-tama-pink" />
                )}
              </div>
            </div>
            {device.showMoreInfo && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-medium text-tama-cyan hover:underline"
                >
                  {expanded ? "Hide info" : "Show more info"}
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="pt-2 text-sm text-stone-600">{device.showMoreInfo}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3">
              <RemoveDeviceButton slug={device.slug} size="sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-all hover:shadow-md">
      <Link href={`/collection/${device.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100">
          <RemoteImage
            src={imageSrc}
            alt={device.deviceModel.name}
            fill
            className="transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {device.favorite && (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow-sm">
              <Heart className="h-4 w-4 fill-tama-pink text-tama-pink" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/collection/${device.slug}`}
              className="block truncate font-semibold text-stone-900 hover:text-tama-cyan"
            >
              {device.deviceModel.name}
            </Link>
            <p className="truncate text-sm text-stone-500">{shellName}</p>
            {device.nickname && (
              <p className="truncate text-xs text-stone-400">&ldquo;{device.nickname}&rdquo;</p>
            )}
          </div>
          <ConditionBadge condition={device.conditionBadge} />
        </div>
        {device.showMoreInfo && (
          <div className="mt-3 border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setExpanded(!expanded);
              }}
              className="text-xs font-medium text-tama-cyan hover:underline"
            >
              {expanded ? "Hide info" : "Show more info"}
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="pt-2 text-sm leading-relaxed text-stone-600">
                  {device.showMoreInfo}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-3 flex justify-end border-t border-stone-100 pt-3">
          <RemoveDeviceButton slug={device.slug} size="sm" />
        </div>
      </div>
    </div>
  );
}
