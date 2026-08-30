"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { memo, useState } from "react";
import { ConditionBadge } from "@/components/collection/condition-badge";
import { EditDeviceButton } from "@/components/collection/edit-device-button";
import { RemoveDeviceButton } from "@/components/collection/remove-device-button";
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EditDeviceButton slug={device.slug} label="Edit device" />
              <RemoveDeviceButton slug={device.slug} size="sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cute-card group overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-tama-cyan/10 via-tama-mint/5 to-tama-pink/10 p-3">
        <Link href={`/collection/${device.slug}`} className="block h-full w-full">
          <div className="relative h-full w-full overflow-hidden rounded-2xl ring-2 ring-white/90 shadow-inner">
            <FramedImage
              src={imageSrc}
              alt={device.deviceModel.name}
              frame={primaryFrame}
              fill
              className="transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        </Link>
        {device.favorite && (
          <div className="pointer-events-none absolute right-5 top-5 rounded-full bg-white/95 p-2 shadow-md">
            <Heart className="h-4 w-4 fill-tama-pink text-tama-pink" />
          </div>
        )}
        <div className="absolute left-5 top-5 z-10">
          <EditDeviceButton
            slug={device.slug}
            size="icon"
            className="h-9 w-9 rounded-full border-white/90 bg-white/95 text-tama-cyan shadow-md hover:bg-white"
          />
        </div>
      </div>
      <div className="p-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/collection/${device.slug}`}
              className="font-display block truncate font-bold text-stone-900 hover:text-tama-cyan"
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
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
          <EditDeviceButton slug={device.slug} label="Edit device" />
          <RemoveDeviceButton slug={device.slug} size="sm" />
        </div>
      </div>
    </div>
  );
});
