"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditDeviceButtonProps {
  slug: string;
  label?: string;
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function EditDeviceButton({
  slug,
  label = "Edit",
  size = "sm",
  className,
}: EditDeviceButtonProps) {
  return (
    <Link
      href={`/collection/${slug}/edit`}
      className={cn(
        buttonVariants({ variant: "outline", size }),
        "border-tama-cyan/40 text-tama-cyan hover:bg-tama-cyan/10 hover:text-tama-cyan",
        className
      )}
    >
      <Pencil className="h-4 w-4" />
      {size !== "icon" && label}
    </Link>
  );
}
