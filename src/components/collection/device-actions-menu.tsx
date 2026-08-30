"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DeviceActionsMenuProps {
  slug: string;
  className?: string;
  removeRedirectTo?: string;
}

export function DeviceActionsMenu({
  slug,
  className,
  removeRedirectTo = "/collection",
}: DeviceActionsMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm("Remove this device from your collection? This cannot be undone.")) {
      return;
    }

    setRemoving(true);
    try {
      const res = await fetch(`/api/collection/${slug}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401) {
        toast.error("Please sign in to remove devices.");
        router.push(`/login?callbackUrl=/collection/${slug}`);
        return;
      }

      if (!res.ok) {
        toast.error("Failed to remove device.");
        return;
      }

      toast.success("Device removed from collection.");
      setOpen(false);
      router.push(removeRedirectTo);
      router.refresh();
    } catch {
      toast.error("Failed to remove device.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 shrink-0 text-stone-500 hover:text-stone-800",
            className
          )}
          aria-label="Device actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1.5">
        <Link
          href={`/collection/${slug}/edit`}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          onClick={() => setOpen(false)}
        >
          <Pencil className="h-4 w-4 text-tama-cyan" />
          Edit device
        </Link>
        <button
          type="button"
          onClick={() => void handleRemove()}
          disabled={removing}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {removing ? "Removing..." : "Remove from Collection"}
        </button>
      </PopoverContent>
    </Popover>
  );
}
