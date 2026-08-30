"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DeviceTypeRecord {
  id: string;
  name: string;
  slug: string;
  family: { id: string; name: string };
  _count: {
    ownedDevices: number;
    shells: number;
    wikiPages: number;
  };
}

export function DeviceTypesManager() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadDeviceTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/device-types", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load device types");
      const data = (await res.json()) as DeviceTypeRecord[];
      setDeviceTypes(data);
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
        type.slug.toLowerCase().includes(query)
    );
  }, [deviceTypes, search]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setAdding(true);
    try {
      const res = await fetch("/api/device-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
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
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
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
        body: JSON.stringify({ name }),
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
    <div className="space-y-5">
      <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Add a new device type..."
          className="h-11 flex-1"
        />
        <Button type="submit" disabled={adding || !newName.trim()} className="shrink-0">
          <Plus className="h-4 w-4" />
          {adding ? "Adding..." : "Add Type"}
        </Button>
      </form>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search device types..."
          className="h-11 pl-10"
        />
      </div>

      <p className="text-sm text-stone-500">
        {loading
          ? "Loading device types..."
          : `${filtered.length} of ${deviceTypes.length} device type${deviceTypes.length === 1 ? "" : "s"}`}
      </p>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="cute-card h-32 animate-pulse bg-stone-100/80" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="cute-card rounded-2xl border-2 border-dashed border-stone-200 px-4 py-10 text-center">
          <p className="font-medium text-stone-700">No device types found</p>
          <p className="mt-1 text-sm text-stone-500">
            {search ? "Try a different search term." : "Add your first device type above."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((type) => {
            const isEditing = editingId === type.id;
            const inUse =
              type._count.ownedDevices > 0 ||
              type._count.shells > 0 ||
              type._count.wikiPages > 0;

            return (
              <div key={type.id} className="cute-card flex h-full flex-col p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      autoFocus
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSaveEdit(type.id);
                        }
                        if (event.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleSaveEdit(type.id)}
                        disabled={savingId === type.id}
                      >
                        {savingId === type.id ? "Saving..." : "Save"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-stone-900">{type.name}</h3>
                      <p className="mt-1 text-xs text-stone-500">{type.family.name}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span
                          className={cn(
                            "rounded-full px-2 py-1",
                            type._count.ownedDevices > 0
                              ? "bg-tama-cyan/10 text-tama-cyan"
                              : "bg-stone-100 text-stone-500"
                          )}
                        >
                          {type._count.ownedDevices} in collection
                        </span>
                        <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-500">
                          {type._count.shells} shells
                        </span>
                        {type._count.wikiPages > 0 && (
                          <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-500">
                            {type._count.wikiPages} wiki
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-stone-100 pt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(type)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={removingId === type.id}
                        onClick={() => void handleRemove(type)}
                        className={cn(
                          !inUse && "text-red-600 hover:text-red-700",
                          inUse && "opacity-70"
                        )}
                        title={
                          inUse
                            ? "Remove collection items, shells, and wiki pages before deleting"
                            : "Remove device type"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        {removingId === type.id ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
