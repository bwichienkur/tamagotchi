"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RemoveDeviceButtonProps {
  slug: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
  redirectTo?: string;
}

export function RemoveDeviceButton({
  slug,
  label = "Remove from Collection",
  variant = "outline",
  size = "sm",
  redirectTo = "/collection",
}: RemoveDeviceButtonProps) {
  const router = useRouter();
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
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Failed to remove device.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleRemove}
      disabled={removing}
      className={variant === "outline" ? "text-red-600 hover:text-red-700" : undefined}
    >
      <Trash2 className="h-4 w-4" />
      {size !== "icon" && (removing ? "Removing..." : label)}
    </Button>
  );
}
