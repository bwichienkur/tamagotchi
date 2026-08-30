"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { RemoteImage } from "@/components/ui/remote-image";
import { uploadImage } from "@/lib/upload-image";

interface CollectionHeroProps {
  initialImage?: string | null;
}

export function CollectionHero({ initialImage }: CollectionHeroProps) {
  const [image, setImage] = useState(initialImage);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const url = await uploadImage(files[0]);
      const res = await fetch("/api/collection/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ collectionImage: url }),
      });
      if (!res.ok) throw new Error("Failed to save collection photo");
      setImage(url);
      toast.success("Collection photo updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const res = await fetch("/api/collection/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ collectionImage: null }),
      });
      if (!res.ok) throw new Error("Failed to remove photo");
      setImage(null);
      toast.success("Collection photo removed");
    } catch {
      toast.error("Failed to remove photo");
    }
  };

  return (
    <div className="cute-card mb-6 overflow-hidden">
      <div
        className="relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center bg-gradient-to-br from-tama-cyan/10 via-white to-tama-pink/10 sm:min-h-[220px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleUpload(e.dataTransfer.files);
        }}
      >
        {image ? (
          <>
            <div className="relative h-48 w-full sm:h-56">
              <RemoteImage src={image} alt="My collection" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
              aria-label="Remove collection photo"
            >
              <X className="h-4 w-4" />
            </button>
            <label className="absolute bottom-3 right-3 cursor-pointer rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow hover:bg-white">
              Change photo
              <input
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 p-8">
            <Upload className="h-8 w-8 text-stone-400" />
            <span className="font-display text-sm font-bold text-stone-600">
              Upload a photo of your collection
            </span>
            <span className="text-xs text-stone-400">
              Drag & drop or click — shelfie, display case, or group shot
            </span>
            <input
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        )}
      </div>
      {uploading && (
        <p className="border-t border-stone-100 px-4 py-2 text-center text-sm text-stone-500">
          Uploading...
        </p>
      )}
    </div>
  );
}
