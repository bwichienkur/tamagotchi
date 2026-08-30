import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditDeviceButtonProps {
  slug: string;
  label?: string;
  size?: "default" | "sm" | "icon";
}

export function EditDeviceButton({
  slug,
  label = "Edit",
  size = "sm",
}: EditDeviceButtonProps) {
  return (
    <Button asChild variant="outline" size={size}>
      <Link href={`/collection/${slug}/edit`}>
        <Pencil className="h-4 w-4" />
        {size !== "icon" && label}
      </Link>
    </Button>
  );
}
