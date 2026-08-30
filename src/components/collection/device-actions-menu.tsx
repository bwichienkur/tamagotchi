"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditDeviceButton } from "@/components/collection/edit-device-button";
import { RemoveDeviceButton } from "@/components/collection/remove-device-button";
import { cn } from "@/lib/utils";

interface DeviceActionsMenuProps {
  slug: string;
  className?: string;
  removeRedirectTo?: string;
}

export function DeviceActionsMenu({
  slug,
  className,
  removeRedirectTo,
}: DeviceActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex items-end gap-2", open && "flex-col", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-stone-500 hover:text-stone-800"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Hide device actions" : "Show device actions"}
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <EditDeviceButton slug={slug} label="Edit device" />
          <RemoveDeviceButton slug={slug} size="sm" redirectTo={removeRedirectTo} />
        </div>
      )}
    </div>
  );
}
