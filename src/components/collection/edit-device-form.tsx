"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatableCombobox, DeviceModelComboboxOption } from "@/components/forms/creatable-combobox";
import { PhotoFrameEditor } from "@/components/collection/photo-frame-editor";
import { FramedImage } from "@/components/ui/framed-image";
import { uploadImage } from "@/lib/upload-image";
import { createDeviceModelOption } from "@/lib/create-device-model";
import { useShellOptions } from "@/hooks/use-shell-options";
import { toDateInputValue } from "@/lib/owned-device-schema";
import {
  DEFAULT_PHOTO_FRAME,
  buildPhotoFramesForSave,
  getAdditionalPhotoFrame,
  getPrimaryPhotoFrame,
  parsePhotoFrames,
  type DevicePhotoFrames,
  type PhotoFrame,
} from "@/lib/photo-frame";
import { cn } from "@/lib/utils";
import { getConditionLabel } from "@/lib/condition-labels";

export interface EditDeviceInitialValues {
  slug: string;
  deviceModelId: string;
  deviceModelFamilyId?: string | null;
  shellId?: string | null;
  shellName?: string | null;
  nickname: string | null;
  primaryPhoto: string | null;
  additionalPhotos: string[];
  photoFrames: DevicePhotoFrames | null;
  conditionBadge: "NONE" | "NIB" | "IOB";
  conditionNotes: string | null;
  showMoreInfo: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  estimatedValue: number | null;
  purchaseCurrency: string | null;
  purchasedFrom: string | null;
  workingStatus: "WORKING" | "NOT_WORKING" | "UNTESTED" | "FOR_PARTS";
  favorite: boolean;
  currentlyRunning: boolean;
  notes: string | null;
}

interface FamilyOption {
  id: string;
  name: string;
}

interface EditDeviceFormProps {
  deviceModels: DeviceModelComboboxOption[];
  families: FamilyOption[];
  device: EditDeviceInitialValues;
}

export function EditDeviceForm({
  deviceModels: initialModels,
  families,
  device,
}: EditDeviceFormProps) {
  const router = useRouter();
  const [deviceModels, setDeviceModels] = useState(initialModels);
  const [deviceModelId, setDeviceModelId] = useState(device.deviceModelId);
  const [newDeviceModelName, setNewDeviceModelName] = useState<string>();
  const [familyId, setFamilyId] = useState(
    device.deviceModelFamilyId ?? families[0]?.id ?? ""
  );
  const [shellId, setShellId] = useState(device.shellId ?? undefined);
  const [newShellName, setNewShellName] = useState(
    !device.shellId && device.shellName ? device.shellName : undefined
  );
  const { shellOptions, loadingShells, createShell } = useShellOptions(deviceModelId);
  const [primaryPhoto, setPrimaryPhoto] = useState(device.primaryPhoto ?? undefined);
  const [additionalPhotos, setAdditionalPhotos] = useState(device.additionalPhotos);
  const [photoFrames, setPhotoFrames] = useState<DevicePhotoFrames>(
    parsePhotoFrames(device.photoFrames)
  );
  const [editingPhoto, setEditingPhoto] = useState<"primary" | number | null>(
    device.primaryPhoto ? "primary" : null
  );
  const [conditionBadge, setConditionBadge] = useState(device.conditionBadge);
  const [conditionNotes, setConditionNotes] = useState(device.conditionNotes ?? "");
  const [nickname, setNickname] = useState(device.nickname ?? "");
  const [showMoreInfo, setShowMoreInfo] = useState(device.showMoreInfo ?? "");
  const [purchaseDate, setPurchaseDate] = useState(toDateInputValue(device.purchaseDate));
  const [purchasePrice, setPurchasePrice] = useState(
    device.purchasePrice != null ? String(device.purchasePrice) : ""
  );
  const [estimatedValue, setEstimatedValue] = useState(
    device.estimatedValue != null ? String(device.estimatedValue) : ""
  );
  const [purchasedFrom, setPurchasedFrom] = useState(device.purchasedFrom ?? "");
  const [workingStatus, setWorkingStatus] = useState(device.workingStatus);
  const [favorite, setFavorite] = useState(device.favorite);
  const [currentlyRunning, setCurrentlyRunning] = useState(device.currentlyRunning);
  const [notes, setNotes] = useState(device.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isCreatingDeviceType = Boolean(newDeviceModelName);

  const resetShellSelection = () => {
    setShellId(undefined);
    setNewShellName(undefined);
  };

  const handleDeviceChange = (value: string, isNew?: boolean, label?: string) => {
    resetShellSelection();
    if (isNew && label) {
      setDeviceModelId("");
      setNewDeviceModelName(label);
    } else {
      setDeviceModelId(value);
      setNewDeviceModelName(undefined);
      const selected = deviceModels.find((model) => model.value === value);
      if (selected?.familyId) {
        setFamilyId(selected.familyId);
      }
      if (label) {
        setDeviceModels((current) =>
          current.some((model) => model.value === value)
            ? current
            : [...current, { value, label, familyId: selected?.familyId }]
        );
      }
    }
  };

  const handleCreateDeviceModel = async (label: string) => {
    if (!familyId) {
      toast.error("Select a family for the device type");
      return null;
    }
    const created = await createDeviceModelOption(label, familyId);
    if (!created) {
      toast.error("Failed to save device type");
      return null;
    }
    setDeviceModels((current) =>
      current.some((model) => model.value === created.value)
        ? current
        : [...current, { ...created, familyId }].sort((a, b) =>
            a.label.localeCompare(b.label)
          )
    );
    setDeviceModelId(created.value);
    setNewDeviceModelName(undefined);
    resetShellSelection();
    return created;
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

  const handleCreateShell = async (label: string) => {
    if (!deviceModelId) {
      setNewShellName(label);
      return null;
    }
    const created = await createShell(label);
    if (!created) return null;
    setShellId(created.value);
    setNewShellName(undefined);
    return created;
  };

  const shellFieldEnabled = Boolean(deviceModelId || newDeviceModelName);

  const updatePrimaryFrame = (frame: PhotoFrame) => {
    setPhotoFrames((current) => ({ ...current, primary: frame }));
  };

  const updateAdditionalFrame = (index: number, frame: PhotoFrame) => {
    setPhotoFrames((current) => ({
      ...current,
      additional: {
        ...(current.additional ?? {}),
        [String(index)]: frame,
      },
    }));
  };

  const removePhotoFrameAtIndex = (index: number) => {
    setPhotoFrames((current) => {
      if (!current.additional) return current;
      const nextAdditional = { ...current.additional };
      delete nextAdditional[String(index)];
      return { ...current, additional: nextAdditional };
    });
  };

  const handlePhotoUpload = async (files: FileList | null, isPrimary = true) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      let extraIndex = additionalPhotos.length;
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        if (isPrimary && i === 0) {
          setPrimaryPhoto(url);
          setEditingPhoto("primary");
          updatePrimaryFrame({ ...DEFAULT_PHOTO_FRAME });
        } else {
          updateAdditionalFrame(extraIndex, { ...DEFAULT_PHOTO_FRAME });
          setAdditionalPhotos((prev) => [...prev, url]);
          setEditingPhoto(extraIndex);
          extraIndex++;
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeAdditionalPhoto = (index: number) => {
    setAdditionalPhotos((prev) => prev.filter((_, i) => i !== index));
    removePhotoFrameAtIndex(index);
    if (editingPhoto === index) {
      setEditingPhoto(primaryPhoto ? "primary" : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceModelId && !newDeviceModelName) {
      toast.error("Please select or create a device type");
      return;
    }
    if (newDeviceModelName && !familyId) {
      toast.error("Select a family for the device type");
      return;
    }

    setSaving(true);
    try {
      const framesToSave = buildPhotoFramesForSave(
        primaryPhoto,
        additionalPhotos,
        photoFrames
      );

      const res = await fetch(`/api/collection/${device.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deviceModelId: newDeviceModelName ? undefined : deviceModelId,
          newDeviceModelName,
          familyId: newDeviceModelName ? familyId : undefined,
          shellId: shellId ?? null,
          newShellName,
          primaryPhoto: primaryPhoto ?? null,
          additionalPhotos,
          photoFrames: framesToSave,
          conditionBadge,
          conditionNotes: conditionNotes || null,
          nickname: nickname || null,
          showMoreInfo: showMoreInfo || null,
          purchaseDate: purchaseDate || null,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
          estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
          purchaseCurrency: device.purchaseCurrency ?? "USD",
          purchasedFrom: purchasedFrom || null,
          workingStatus,
          favorite,
          currentlyRunning,
          notes: notes || null,
        }),
      });

      if (res.status === 401) {
        toast.error("Please sign in to edit devices.");
        router.push(`/login?callbackUrl=/collection/${device.slug}/edit`);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to save device changes"
        );
      }

      toast.success("Device updated!");
      router.push(`/collection/${device.slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update device");
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
        <CardContent className="space-y-6">
          <div
            className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 transition-colors hover:border-tama-cyan/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handlePhotoUpload(e.dataTransfer.files);
            }}
          >
            {primaryPhoto ? (
              <button
                type="button"
                onClick={() => setEditingPhoto("primary")}
                className={cn(
                  "relative h-48 w-48 overflow-hidden rounded-2xl ring-2 transition-all",
                  editingPhoto === "primary" ? "ring-tama-cyan" : "ring-transparent"
                )}
              >
                <FramedImage
                  src={primaryPhoto}
                  alt="Device"
                  frame={getPrimaryPhotoFrame(photoFrames)}
                />
              </button>
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
            {primaryPhoto && (
              <button
                type="button"
                onClick={() => {
                  setPrimaryPhoto(undefined);
                  setPhotoFrames((current) => ({ ...current, primary: undefined }));
                  setEditingPhoto(additionalPhotos.length > 0 ? 0 : null);
                }}
                className="absolute right-4 top-4 rounded-full bg-white p-1 shadow"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {uploading && <p className="mt-2 text-sm text-stone-500">Uploading...</p>}

          {primaryPhoto && editingPhoto === "primary" && (
            <PhotoFrameEditor
              src={primaryPhoto}
              alt="Primary device photo"
              frame={getPrimaryPhotoFrame(photoFrames)}
              onChange={updatePrimaryFrame}
            />
          )}

          <div className="mt-4">
            <Label className="mb-2 block text-sm text-stone-600">Additional photos</Label>
            <div className="flex flex-wrap gap-2">
              {additionalPhotos.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEditingPhoto(i)}
                  className={cn(
                    "relative h-16 w-16 overflow-hidden rounded-xl ring-2 transition-all",
                    editingPhoto === i ? "ring-tama-cyan" : "ring-transparent"
                  )}
                >
                  <FramedImage
                    src={url}
                    alt={`Additional photo ${i + 1}`}
                    frame={getAdditionalPhotoFrame(photoFrames, i)}
                  />
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeAdditionalPhoto(i);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        removeAdditionalPhoto(i);
                      }
                    }}
                    className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </button>
              ))}
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border border-dashed border-stone-200 text-stone-400 hover:border-tama-cyan/50">
                <Upload className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files, false)}
                />
              </label>
            </div>
          </div>

          {typeof editingPhoto === "number" && additionalPhotos[editingPhoto] && (
            <PhotoFrameEditor
              src={additionalPhotos[editingPhoto]}
              alt={`Additional photo ${editingPhoto + 1}`}
              frame={getAdditionalPhotoFrame(photoFrames, editingPhoto)}
              onChange={(frame) => updateAdditionalFrame(editingPhoto, frame)}
            />
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
              pendingLabel={newDeviceModelName}
              onValueChange={handleDeviceChange}
              onCreateOption={handleCreateDeviceModel}
              placeholder="Type a device type..."
              createLabel={(v) => `Add "${v}"`}
            />
            <p className="text-xs text-stone-500">
              Type a name and press Enter to add a new device type to your library.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-family">Family</Label>
            <select
              id="device-family"
              value={familyId}
              onChange={(event) => setFamilyId(event.target.value)}
              disabled={!isCreatingDeviceType}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm disabled:bg-stone-50 disabled:text-stone-500"
            >
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-500">
              {isCreatingDeviceType
                ? "Choose Vintage, Connection, Modern, or another family for filtering."
                : "Family is set from the selected device type."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Shell</Label>
            <CreatableCombobox
              options={shellOptions}
              value={shellId}
              pendingLabel={newShellName}
              onValueChange={handleShellChange}
              onCreateOption={deviceModelId ? handleCreateShell : undefined}
              placeholder={
                shellFieldEnabled
                  ? loadingShells
                    ? "Loading shells..."
                    : "Type a shell name..."
                  : "Select a device type first"
              }
              createLabel={(v) => `Add "${v}"`}
              disabled={!shellFieldEnabled || loadingShells}
            />
            <p className="text-xs text-stone-500">
              Optional. Type a shell colorway or press Enter to add a new one.
            </p>
          </div>

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
                  {getConditionLabel(badge)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditionNotes">Condition notes</Label>
            <Textarea
              id="conditionNotes"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="Describe scratches, wear, missing parts..."
              rows={2}
            />
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

          <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value</Label>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
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
            <Label htmlFor="workingStatus">Working status</Label>
            <select
              id="workingStatus"
              value={workingStatus}
              onChange={(e) =>
                setWorkingStatus(
                  e.target.value as "WORKING" | "NOT_WORKING" | "UNTESTED" | "FOR_PARTS"
                )
              }
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <option value="WORKING">Working</option>
              <option value="NOT_WORKING">Not working</option>
              <option value="UNTESTED">Untested</option>
              <option value="FOR_PARTS">For parts</option>
            </select>
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
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
