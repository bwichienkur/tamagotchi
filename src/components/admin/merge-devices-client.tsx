"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreatableCombobox, ComboboxOption } from "@/components/forms/creatable-combobox";

export function MergeDevicesClient() {
  const [models, setModels] = useState<ComboboxOption[]>([]);
  const [fromId, setFromId] = useState<string>();
  const [toId, setToId] = useState<string>();
  const [preview, setPreview] = useState<{
    shells: number;
    wikiPages: number;
    ownedDevices: number;
  } | null>(null);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    fetch("/api/devices")
      .then((r) => r.json())
      .then((data) =>
        setModels(data.map((m: { id: string; name: string }) => ({ value: m.id, label: m.name })))
      );
  }, []);

  useEffect(() => {
    if (fromId) {
      fetch(`/api/admin/merge?fromId=${fromId}`)
        .then((r) => r.json())
        .then(setPreview);
    } else {
      setPreview(null);
    }
  }, [fromId]);

  const handleMerge = async () => {
    if (!fromId || !toId || fromId === toId) {
      toast.error("Select two different devices");
      return;
    }
    if (!confirm("This will reassign all related data. Continue?")) return;

    setMerging(true);
    try {
      const res = await fetch("/api/admin/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId, toId }),
      });
      if (!res.ok) throw new Error();
      toast.success("Devices merged successfully");
      setFromId(undefined);
      setToId(undefined);
      setPreview(null);
    } catch {
      toast.error("Merge failed");
    } finally {
      setMerging(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Merge FROM</label>
          <CreatableCombobox
            options={models}
            value={fromId}
            onValueChange={(v) => setFromId(v)}
            placeholder="Select device to merge away..."
            createLabel={() => ""}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Merge INTO</label>
          <CreatableCombobox
            options={models}
            value={toId}
            onValueChange={(v) => setToId(v)}
            placeholder="Select target device..."
            createLabel={() => ""}
          />
        </div>

        {preview && (
          <div className="rounded-xl bg-stone-50 p-4 text-sm">
            <p>Will reassign:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>{preview.shells} shells</li>
              <li>{preview.wikiPages} wiki pages</li>
              <li>{preview.ownedDevices} owned devices</li>
            </ul>
          </div>
        )}

        <Button onClick={handleMerge} disabled={merging || !fromId || !toId}>
          {merging ? "Merging..." : "Merge"}
        </Button>
      </CardContent>
    </Card>
  );
}
