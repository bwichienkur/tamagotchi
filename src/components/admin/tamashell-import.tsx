"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImportPreview } from "@/lib/importers/tamashell";

export function TamaShellImportClient() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/import/tamashell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      const data = await res.json();
      setPreview(data);
      toast.success("Scan complete");
    } catch {
      toast.error("Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const selections = preview.items
        .filter((item) => item.newShells.length > 0)
        .map((item) => ({
          deviceName: item.deviceName,
          family: item.family,
          useExistingDeviceId: item.possibleDeviceMatch?.existing.id,
          shells: item.newShells,
        }));

      const res = await fetch("/api/import/tamashell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", selections }),
      });
      const result = await res.json();
      toast.success(`Imported ${result.imported} shells, skipped ${result.skipped}`);
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TamaShell Import</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-stone-500">
            Scan TamaShell catalog for shell metadata. Results are previewed before import.
          </p>
          <Button onClick={handleScan} disabled={scanning}>
            {scanning ? "Scanning..." : "Scan TamaShell"}
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Import Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {preview.items.map((item) => (
              <div key={item.deviceName} className="rounded-xl border border-stone-200 p-4">
                <h3 className="font-semibold">{item.deviceName}</h3>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-green-600">New: {item.newShells.length}</span>
                  <span className="text-stone-500">Existing: {item.existingShells.length}</span>
                  <span className="text-amber-600">
                    Possible duplicates: {item.possibleDuplicates.length}
                  </span>
                </div>
                {item.possibleDeviceMatch && (
                  <div className="mt-2 rounded-lg bg-amber-50 p-2 text-sm">
                    <p className="font-medium text-amber-800">Possible device match</p>
                    <p>Imported: {item.possibleDeviceMatch.imported}</p>
                    <p>Existing: {item.possibleDeviceMatch.existing.name}</p>
                  </div>
                )}
                {item.possibleDuplicates.map((dup, i) => (
                  <div key={i} className="mt-2 rounded-lg bg-amber-50 p-2 text-sm">
                    <p>Imported: {dup.imported.name}</p>
                    <p>Existing: {dup.existing.name}</p>
                  </div>
                ))}
              </div>
            ))}
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing..." : "Import New Shells"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
