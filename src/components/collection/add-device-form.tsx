"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatableCombobox, ComboboxOption } from "@/components/forms/creatable-combobox";
import { RemoteImage } from "@/components/ui/remote-image";
import { uploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";

interface AddDeviceFormProps {
  deviceModels: ComboboxOption[];
}

export function AddDeviceForm({ deviceModels: initialModels }: AddDeviceFormProps) {
  const router = useRouter();
  const [deviceModels, setDeviceModels] = useState(initialModels);
  const [deviceModelId, setDeviceModelId] = useState<string>();
  const [newDeviceModelName, setNewDeviceModelName] = useState<string>();
  const [shellId, setShellId] = useState<string>();
  const [newShellName, setNewShellName] = useState<string>();
  const [shellOptions, setShellOptions] = useState<ComboboxOption[]>([]);
  const [primaryPhoto, setPrimaryPhoto] = useState<string>();
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [conditionBadge, setConditionBadge] = useState<"NONE" | "NIB" | "IOB">("NONE");
  const [nickname, setNickname] = useState("");
  const [showMoreInfo, setShowMoreInfo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchasedFrom, setPurchasedFrom] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [workingStatus, setWorkingStatus] = useState("UNTESTED");
  const [favorite, setFavorite] = useState(false);
  const [currentlyRunning, setCurrentlyRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadShells = useCallback(async (modelId: string) => {
    const res = await fetch(`/api/shells?deviceModelId=${modelId}`);
    const shells = await res.json();
    setShellOptions(
      shells.map((s: { id: string; name: string }) => ({
        value: s.id,
        label: s.name,
      }))
    );
  }, []);

  const handleDeviceChange = (value: string, isNew?: boolean, label?: string) => {
    if (isNew && label) {
      setDeviceModelId(undefined);
      setNewDeviceModelName(label);
      setShellOptions([]);
      setShellId(undefined);
    } else {
      setDeviceModelId(value);
      setNewDeviceModelName(undefined);
      loadShells(value);
    }
  };

  const handleShellChange = (value: string, isNew?: boolean, label?: string) => {
    if (isNew && label) {
      setShellId(undefined);
      setNewShellName(label);
    } else {
      setShellId(value);
      setNewShellName(undefined);
    }
  };

  const uploadFile = async (file: File): Promise<string> => uploadImage(file);

  const handlePhotoUpload = async (files: FileList | null, isPrimary = true) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i]);
        if (isPrimary && i === 0) {
          setPrimaryPhoto(url);
        } else {
          setAdditionalPhotos((prev) => [...prev, url]);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceModelId && !newDeviceModelName) {
      toast.error("Please select or create a device type");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deviceModelId,
          newDeviceModelName,
          shellId,
          newShellName,
          primaryPhoto,
          additionalPhotos,
          conditionBadge,
          nickname: nickname || undefined,
          showMoreInfo: showMoreInfo || undefined,
          purchaseDate: purchaseDate || undefined,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
          purchasedFrom: purchasedFrom || undefined,
          serialNumber: serialNumber || undefined,
          workingStatus,
          favorite,
          currentlyRunning,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const device = await res.json();
      toast.success("Device added to collection!");
      router.push(`/collection/${device.slug}`);
    } catch {
      toast.error("Failed to add device");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 transition-colors hover:border-tama-cyan/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handlePhotoUpload(e.dataTransfer.files);
            }}
          >
            {primaryPhoto ? (
              <div className="relative h-48 w-48">
                <RemoteImage src={primaryPhoto} alt="Device" fill />
                <button
                  type="button"
                  onClick={() => setPrimaryPhoto(undefined)}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 p-8">
                <Upload className="h-8 w-8 text-stone-400" />
                <span className="text-sm text-stone-500">
                  Drag & drop or click to upload
                </span>
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                />
              </label>
            )}
          </div>
          {uploading && <p className="mt-2 text-sm text-stone-500">Uploading...</p>}
          {additionalPhotos.length > 0 && (
            <div className="mt-4 flex gap-2">
              {additionalPhotos.map((url, i) => (
                <div key={i} className="relative h-16 w-16">
                  <RemoteImage src={url} alt={`Additional photo ${i + 1}`} fill />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Device Type</Label>
            <CreatableCombobox
              options={deviceModels}
              value={deviceModelId}
              onValueChange={handleDeviceChange}
              placeholder="Search or enter device type..."
              createLabel={(v) => `Create "${v}"`}
            />
          </div>

          {(deviceModelId || newDeviceModelName) && (
            <div className="space-y-2">
              <Label>Shell</Label>
              <CreatableCombobox
                options={shellOptions}
                value={shellId}
                onValueChange={handleShellChange}
                placeholder="Search shell or create custom..."
                createLabel={(v) => `Create "${v}"`}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Condition</Label>
            <div className="flex gap-2">
              {(["NONE", "NIB", "IOB"] as const).map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setConditionBadge(badge)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                    conditionBadge === badge
                      ? "border-tama-cyan bg-tama-cyan/10 text-tama-cyan"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  )}
                >
                  {badge === "NONE" ? "None" : badge}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Optional nickname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="showMoreInfo">Show more info</Label>
            <Textarea
              id="showMoreInfo"
              value={showMoreInfo}
              onChange={(e) => setShowMoreInfo(e.target.value)}
              placeholder="Additional details shown on collection card when expanded..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasedFrom">Purchased From</Label>
            <Input
              id="purchasedFrom"
              value={purchasedFrom}
              onChange={(e) => setPurchasedFrom(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial / Reference Number</Label>
            <Input
              id="serialNumber"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                className="rounded"
              />
              Favorite
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={currentlyRunning}
                onChange={(e) => setCurrentlyRunning(e.target.checked)}
                className="rounded"
              />
              Currently running
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving..." : "Add to Collection"}
        </Button>
      </div>
    </form>
  );
}
