"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RemoteImage } from "@/components/ui/remote-image";
import { uploadImage } from "@/lib/upload-image";

interface WikiPagePhotoEditorProps {
  title: string;
  coverImage: string | null;
  onChange: (coverImage: string | null) => void;
}

export function WikiPagePhotoEditor({
  title,
  coverImage,
  onChange,
}: WikiPagePhotoEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success("Photo uploaded. Click Save to publish it on the page.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section
      id="page-photo"
      className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-stone-900">Page Photo</h2>
        <p className="mt-1 text-sm text-stone-500">
          Add a header photo for {title}. This appears at the top of the wiki page.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-full max-w-[220px] overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10">
          <div className="relative aspect-square">
            <RemoteImage
              src={coverImage ?? "/placeholder-device.svg"}
              alt={title}
              fill
              className="object-contain p-3"
              sizes="220px"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Upload from your device</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handlePhotoUpload(file);
              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Uploading..." : coverImage ? "Change photo" : "Add photo"}
            </Button>
            {coverImage && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
