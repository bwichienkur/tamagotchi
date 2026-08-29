"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DeleteWikiButtonProps {
  slug: string;
  title: string;
}

export function DeleteWikiButton({ slug, title }: DeleteWikiButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete "${title}"? This permanently removes the wiki page and its history. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/wiki/${slug}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        toast.error("Please sign in to delete wiki pages.");
        router.push(`/login?callbackUrl=/wiki/${slug}`);
        return;
      }

      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Failed to delete page.");
        return;
      }

      toast.success("Wiki page deleted.");
      router.push("/wiki");
      router.refresh();
    } catch {
      toast.error("Failed to delete page.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? "Deleting..." : "Delete Page"}
    </Button>
  );
}
