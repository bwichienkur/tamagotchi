"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const BADGE_CONFIG = {
  NIB: { label: "NIB", tooltip: "New In Box" },
  IOB: { label: "IOB", tooltip: "In Original Box" },
} as const;

type BadgeType = keyof typeof BADGE_CONFIG;

interface ConditionBadgeProps {
  condition: "NONE" | "NIB" | "IOB";
  className?: string;
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  if (condition === "NONE") return null;

  const config = BADGE_CONFIG[condition as BadgeType];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center rounded-full bg-gradient-to-r from-tama-mint/40 to-tama-cyan/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-tama-mint/60",
              className
            )}
          >
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>{config.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
