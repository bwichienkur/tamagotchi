"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { memo, useState } from "react";
import { ConditionBadge } from "@/components/collection/condition-badge";
import { DeviceActionsMenu } from "@/components/collection/device-actions-menu";
import { FramedImage } from "@/components/ui/framed-image";
import { cn } from "@/lib/utils";
import {
  getPrimaryPhotoFrame,
  parsePhotoFrames,
} from "@/lib/photo-frame";

export interface CollectionCardData {
  id: string;
  slug: string;
  nickname?: string | null;
  primaryPhoto?: string | null;
  photoFrames?: unknown;
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

export const CollectionCard = memo(function CollectionCard({
  device,
  view = "grid",
}: CollectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const shellName = device.shell?.name ?? device.customShellName ?? "Unknown shell";
  const imageSrc = device.primaryPhoto ?? "/placeholder-device.svg";
  const primaryFrame = getPrimaryPhotoFrame(parsePhotoFrames(device.photoFrames));

  if (view === "list") {
    return (
      <div className="cute-card group p-4">
        <div className="flex gap-4">
          <Link href={`/collection/${device.slug}`} className="shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10 ring-2 ring-white">
              <FramedImage
                src={imageSrc}
                alt={device.deviceModel.name}
                frame={primaryFrame}
                fill
                sizes="96px"
              />
            </div>
          </Link>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/collection/${device.slug}`}
                  className="font-semibold leading-tight text-stone-900 hover:text-tama-cyan"
                >
                  {device.nickname ?? device.deviceModel.name}
                </Link>
                <p className="text-sm leading-snug text-stone-500">{shellName}</p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <ConditionBadge condition={device.conditionBadge} />
                {device.favorite && (
                  <Heart className="h-4 w-4 fill-tama-pink text-tama-pink" />
                )}
                <DeviceActionsMenu slug={device.slug} />
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cute-card group relative h-full overflow-hidden">
      <Link href={`/collection/${device.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-tama-cyan/10 via-tama-mint/5 to-tama-pink/10 p-1 sm:p-2">
          <div className="relative h-full w-full overflow-hidden rounded-xl ring-2 ring-white/90 shadow-inner sm:rounded-2xl">
            <FramedImage
              src={imageSrc}
              alt={device.deviceModel.name}
              frame={primaryFrame}
              fill
              className="object-contain p-1 transition-transform duration-300 group-hover:scale-105 sm:p-2"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        </div>
      </Link>
      {device.favorite && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/95 p-1.5 shadow-md sm:right-4 sm:top-4 sm:p-2">
          <Heart className="h-3.5 w-3.5 fill-tama-pink text-tama-pink sm:h-4 sm:w-4" />
        </div>
      )}
      <div className="px-2 pb-2 pt-1.5 sm:px-3 sm:pb-3 sm:pt-2">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/collection/${device.slug}`}
              className="font-display line-clamp-2 text-xs font-bold leading-tight text-stone-900 hover:text-tama-cyan sm:text-sm"
            >
              {device.nickname ?? device.deviceModel.name}
            </Link>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-stone-500 sm:text-xs">
              {shellName}
            </p>
            {device.nickname && (
              <p className="mt-0.5 truncate text-[10px] leading-snug text-stone-400 sm:text-xs">
                {device.deviceModel.name}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-start gap-0.5 sm:gap-1">
            <ConditionBadge condition={device.conditionBadge} />
            <DeviceActionsMenu slug={device.slug} />
          </div>
        </div>
        {device.showMoreInfo && (
          <div className="mt-1.5 border-t border-stone-100 pt-1.5 sm:mt-2 sm:pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setExpanded(!expanded);
              }}
              className="text-[10px] font-medium text-tama-cyan hover:underline sm:text-xs"
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
                <p className="pt-1.5 text-[10px] leading-relaxed text-stone-600 sm:pt-2 sm:text-sm">
                  {device.showMoreInfo}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
