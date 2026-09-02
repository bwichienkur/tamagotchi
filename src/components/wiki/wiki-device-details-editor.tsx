"use client";

import { useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RemoteImage } from "@/components/ui/remote-image";
import { uploadImage } from "@/lib/upload-image";

export interface WikiDeviceProperty {
  id?: string;
  group: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface WikiDeviceDetails {
  id: string;
  name: string;
  heroImage?: string | null;
  manufacturer?: string | null;
  releaseYear?: number | null;
  regions: string[];
  family?: { name: string } | null;
  properties: WikiDeviceProperty[];
}

export interface WikiDeviceDetailsInput {
  heroImage?: string | null;
  manufacturer?: string | null;
  releaseYear?: number | null;
  regions: string[];
  properties: WikiDeviceProperty[];
}

interface WikiDeviceDetailsEditorProps {
  device: WikiDeviceDetails;
  value: WikiDeviceDetailsInput;
  onChange: (value: WikiDeviceDetailsInput) => void;
}

export function WikiDeviceDetailsEditor({
  device,
  value,
  onChange,
}: WikiDeviceDetailsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const update = (patch: Partial<WikiDeviceDetailsInput>) => {
    onChange({ ...value, ...patch });
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      update({ heroImage: url });
      toast.success("Photo uploaded. Click Save to publish it on the wiki page.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const addProperty = () => {
    update({
      properties: [
        ...value.properties,
        {
          group: "Details",
          label: "New field",
          value: "",
          sortOrder: value.properties.length,
        },
      ],
    });
  };

  const updateProperty = (index: number, patch: Partial<WikiDeviceProperty>) => {
    update({
      properties: value.properties.map((property, i) =>
        i === index ? { ...property, ...patch } : property
      ),
    });
  };

  const removeProperty = (index: number) => {
    update({
      properties: value.properties.filter((_, i) => i !== index),
    });
  };

  return (
    <section
      id="device-details"
      className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-stone-900">Photo &amp; Details</h2>
        <p className="mt-1 text-sm text-stone-500">
          These appear in the sidebar infobox on the wiki page for {device.name}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div>
          <Label>Device photo</Label>
          <div className="mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10">
            <div className="relative aspect-square">
              <RemoteImage
                src={value.heroImage ?? "/placeholder-device.svg"}
                alt={device.name}
                fill
                className="object-contain p-3"
                sizes="220px"
              />
            </div>
          </div>
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
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Uploading..." : value.heroImage ? "Change photo" : "Add photo"}
            </Button>
            {value.heroImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update({ heroImage: null })}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="device-manufacturer">Manufacturer</Label>
              <Input
                id="device-manufacturer"
                value={value.manufacturer ?? ""}
                onChange={(e) => update({ manufacturer: e.target.value || null })}
                placeholder="Bandai"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-release-year">Release year</Label>
              <Input
                id="device-release-year"
                type="number"
                value={value.releaseYear ?? ""}
                onChange={(e) =>
                  update({
                    releaseYear: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="2021"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-regions">Regions</Label>
            <Input
              id="device-regions"
              value={value.regions.join(", ")}
              onChange={(e) =>
                update({
                  regions: e.target.value
                    .split(",")
                    .map((region) => region.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Japan, USA, Europe"
            />
          </div>

          {device.family && (
            <p className="text-sm text-stone-500">
              Series: <span className="font-medium text-stone-700">{device.family.name}</span>
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Detail fields</Label>
              <Button type="button" variant="outline" size="sm" onClick={addProperty}>
                <Plus className="h-4 w-4" />
                Add field
              </Button>
            </div>

            {value.properties.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-sm text-stone-500">
                No custom detail fields yet. Add fields like Screen type, Battery, or
                Connectivity to fill the infobox.
              </p>
            ) : (
              <div className="space-y-3">
                {value.properties.map((property, index) => (
                  <div
                    key={`${property.id ?? "new"}-${index}`}
                    className="grid gap-2 rounded-xl border border-stone-100 bg-stone-50/80 p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]"
                  >
                    <Input
                      value={property.group}
                      onChange={(e) => updateProperty(index, { group: e.target.value })}
                      placeholder="Group"
                      aria-label="Field group"
                    />
                    <Input
                      value={property.label}
                      onChange={(e) => updateProperty(index, { label: e.target.value })}
                      placeholder="Label"
                      aria-label="Field label"
                    />
                    <Input
                      value={property.value}
                      onChange={(e) => updateProperty(index, { value: e.target.value })}
                      placeholder="Value"
                      aria-label="Field value"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProperty(index)}
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function createDeviceDetailsInput(device: WikiDeviceDetails): WikiDeviceDetailsInput {
  return {
    heroImage: device.heroImage ?? null,
    manufacturer: device.manufacturer ?? null,
    releaseYear: device.releaseYear ?? null,
    regions: device.regions ?? [],
    properties: device.properties.map((property, index) => ({
      ...property,
      sortOrder: property.sortOrder ?? index,
    })),
  };
}
