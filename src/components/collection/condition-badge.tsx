"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getConditionLabel, getConditionTooltip, type ConditionBadgeValue } from "@/lib/condition-labels";
import { cn } from "@/lib/utils";

interface ConditionBadgeProps {
  condition: ConditionBadgeValue;
  className?: string;
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  const isNoBox = condition === "NONE";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
              isNoBox
                ? "bg-stone-100 text-stone-600 ring-stone-200"
                : "bg-gradient-to-r from-tama-mint/40 to-tama-cyan/30 text-emerald-800 ring-tama-mint/60",
              className
            )}
          >
            {getConditionLabel(condition)}
          </span>
        </TooltipTrigger>
        <TooltipContent>{getConditionTooltip(condition)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
