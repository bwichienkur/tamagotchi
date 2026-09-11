"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShellWishlistButtonProps {
  shellId: string;
  initialWishlisted?: boolean;
  className?: string;
  onToggle?: (wishlisted: boolean) => void;
}

export function ShellWishlistButton({
  shellId,
  initialWishlisted = false,
  className,
  onToggle,
}: ShellWishlistButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, setPending] = useState(false);

  const toggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const next = !wishlisted;
    setWishlisted(next);
    setPending(true);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shellId }),
      });

      if (!res.ok) {
        throw new Error("Wishlist update failed");
      }

      const data = (await res.json()) as { wishlisted?: boolean };
      const resolved = typeof data.wishlisted === "boolean" ? data.wishlisted : next;
      setWishlisted(resolved);
      onToggle?.(resolved);

      toast.success(resolved ? "Added to wishlist" : "Removed from wishlist");
    } catch {
      setWishlisted(!next);
      toast.error("Could not update wishlist");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "absolute right-1.5 top-1.5 z-10 rounded-full bg-white/95 p-1.5 shadow-md transition-colors sm:right-2 sm:top-2",
        wishlisted ? "text-tama-pink" : "text-stone-400 hover:text-tama-pink",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} />
    </button>
  );
}
