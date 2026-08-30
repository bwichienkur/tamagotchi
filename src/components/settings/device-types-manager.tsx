"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DeviceTypeRecord {
  id: string;
  name: string;
  slug: string;
  generation?: string | null;
  series?: { id: string; name: string } | null;
  family: { id: string; name: string };
  _count: {
    ownedDevices: number;
    shells: number;
    wikiPages: number;
  };
}

interface FamilyOption {
  id: string;
  name: string;
}

interface SeriesOption {
  id: string;
  name: string;
  family: { id: string; name: string };
}

interface DeviceTypesManagerProps {
  families: FamilyOption[];
}

export function DeviceTypesManager({ families }: DeviceTypesManagerProps) {
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeRecord[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newFamilyId, setNewFamilyId] = useState(families[0]?.id ?? "");
  const [newSeriesId, setNewSeriesId] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFamilyId, setEditFamilyId] = useState("");
  const [editSeriesId, setEditSeriesId] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadDeviceTypes = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, seriesRes] = await Promise.all([
        fetch("/api/device-types", { credentials: "include" }),
        fetch("/api/series", { credentials: "include" }),
      ]);
      if (!typesRes.ok) throw new Error("Failed to load device types");
      const data = (await typesRes.json()) as DeviceTypeRecord[];
      setDeviceTypes(data);
      if (seriesRes.ok) {
        setSeriesOptions((await seriesRes.json()) as SeriesOption[]);
      }
    } catch {
      toast.error("Failed to load device types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeviceTypes();
  }, [loadDeviceTypes]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return deviceTypes;
    return deviceTypes.filter(
      (type) =>
        type.name.toLowerCase().includes(query) ||
        type.family.name.toLowerCase().includes(query) ||
        type.generation?.toLowerCase().includes(query) ||
        type.slug.toLowerCase().includes(query)
    );
  }, [deviceTypes, search]);

  const seriesForFamily = useCallback(
    (familyId: string) => seriesOptions.filter((series) => series.family.id === familyId),
    [seriesOptions]
  );

  const seriesLabel = (type: DeviceTypeRecord) =>
    type.series?.name ?? type.generation ?? null;

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name || !newFamilyId) return;

    setAdding(true);
    try {
      const res = await fetch("/api/device-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          familyId: newFamilyId,
          seriesId: newSeriesId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add device type");
      }

      const created = (await res.json()) as DeviceTypeRecord;
      setDeviceTypes((current) => {
        const withoutDuplicate = current.filter((type) => type.id !== created.id);
        return [...withoutDuplicate, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setNewName("");
      setNewSeriesId("");
      toast.success(created.name === name ? "Device type added" : "Device type already exists");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add device type");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (type: DeviceTypeRecord) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditFamilyId(type.family.id);
    setEditSeriesId(type.series?.id ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditFamilyId("");
    setEditSeriesId("");
  };

  const handleSaveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch(`/api/device-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          familyId: editFamilyId,
          seriesId: editSeriesId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update device type");
      }

      const updated = data as DeviceTypeRecord;
      setDeviceTypes((current) =>
        current
          .map((type) => (type.id === id ? updated : type))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
      toast.success("Device type updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update device type");
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (type: DeviceTypeRecord) => {
    if (
      !confirm(
        `Remove "${type.name}" from the device type library? This cannot be undone.`
      )
    ) {
      return;
    }

    setRemovingId(type.id);
    try {
      const res = await fetch(`/api/device-types/${type.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to remove device type");
      }

      setDeviceTypes((current) => current.filter((item) => item.id !== type.id));
      if (editingId === type.id) cancelEdit();
      toast.success("Device type removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove device type");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      <form onSubmit={handleAdd} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <select
          value={newFamilyId}
          onChange={(event) => {
            setNewFamilyId(event.target.value);
            setNewSeriesId("");
          }}
          className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm"
        >
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
        <select
          value={newSeriesId}
          onChange={(event) => setNewSeriesId(event.target.value)}
          className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm"
        >
          <option value="">No series</option>
          {seriesForFamily(newFamilyId).map((series) => (
            <option key={series.id} value={series.id}>
              {series.name}
            </option>
          ))}
        </select>
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Add device type..."
          className="h-9"
        />
        <Button
          type="submit"
          size="sm"
          disabled={adding || !newName.trim() || !newFamilyId}
          className="h-9 shrink-0"
        >
          <Plus className="h-4 w-4" />
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search device types..."
          className="h-9 pl-9"
        />
      </div>

      <p className="text-xs text-stone-500">
        {loading
          ? "Loading device types..."
          : `${filtered.length} of ${deviceTypes.length} device type${deviceTypes.length === 1 ? "" : "s"}`}
      </p>

      {loading ? (
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 min-w-0 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
          {search ? "No device types match your search." : "No device types yet."}
        </div>
      ) : (
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((type) => {
            const isEditing = editingId === type.id;
            const inUse =
              type._count.ownedDevices > 0 ||
              type._count.shells > 0 ||
              type._count.wikiPages > 0;

            return (
              <div
                key={type.id}
                className="min-w-0 overflow-hidden rounded-lg border border-stone-200 bg-white px-3 py-2"
              >
                {isEditing ? (
                  <div className="flex min-w-0 flex-col gap-2">
                    <select
                      value={editFamilyId}
                      onChange={(event) => {
                        setEditFamilyId(event.target.value);
                        setEditSeriesId("");
                      }}
                      className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-sm"
                    >
                      {families.map((family) => (
                        <option key={family.id} value={family.id}>
                          {family.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editSeriesId}
                      onChange={(event) => setEditSeriesId(event.target.value)}
                      className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-sm"
                    >
                      <option value="">No series</option>
                      {seriesForFamily(editFamilyId).map((series) => (
                        <option key={series.id} value={series.id}>
                          {series.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      autoFocus
                      className="h-8 min-w-0 w-full sm:flex-1"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSaveEdit(type.id);
                        }
                        if (event.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-2 sm:px-3"
                        onClick={() => void handleSaveEdit(type.id)}
                        disabled={savingId === type.id}
                        aria-label="Save device type"
                      >
                        {savingId === type.id ? (
                          "..."
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 sm:hidden" />
                            <span className="hidden sm:inline">Save</span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 sm:px-3"
                        onClick={cancelEdit}
                        aria-label="Cancel editing"
                      >
                        <X className="h-3.5 w-3.5 sm:hidden" />
                        <span className="hidden sm:inline">Cancel</span>
                      </Button>
                    </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {type.name}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {type.family.name}
                        {seriesLabel(type) ? ` · ${seriesLabel(type)}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 px-2"
                      onClick={() => startEdit(type)}
                      aria-label={`Edit ${type.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-8 shrink-0 px-2",
                        !inUse && "text-red-600 hover:text-red-700"
                      )}
                      disabled={removingId === type.id}
                      onClick={() => void handleRemove(type)}
                      aria-label={`Remove ${type.name}`}
                      title={
                        inUse
                          ? "Remove collection items, shells, and wiki pages before deleting"
                          : "Remove device type"
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">
                        {removingId === type.id ? "Removing..." : "Remove"}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
