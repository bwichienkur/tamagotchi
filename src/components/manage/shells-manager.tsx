"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DeviceModelOption {
  id: string;
  name: string;
}

interface ShellRecord {
  id: string;
  name: string;
  slug: string;
  deviceModel: { id: string; name: string };
  _count: {
    ownedDevices: number;
    wishlistItems: number;
  };
}

interface ShellsManagerProps {
  deviceModels: DeviceModelOption[];
}

export function ShellsManager({ deviceModels }: ShellsManagerProps) {
  const [shells, setShells] = useState<ShellRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [newName, setNewName] = useState("");
  const [newDeviceModelId, setNewDeviceModelId] = useState(deviceModels[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadShells = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shells", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load shells");
      const data = (await res.json()) as ShellRecord[];
      setShells(data);
    } catch {
      toast.error("Failed to load shells");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShells();
  }, [loadShells]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return shells.filter((shell) => {
      if (modelFilter && shell.deviceModel.id !== modelFilter) return false;
      if (!query) return true;
      return (
        shell.name.toLowerCase().includes(query) ||
        shell.deviceModel.name.toLowerCase().includes(query) ||
        shell.slug.toLowerCase().includes(query)
      );
    });
  }, [shells, search, modelFilter]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name || !newDeviceModelId) return;

    setAdding(true);
    try {
      const res = await fetch("/api/shells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deviceModelId: newDeviceModelId, name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add shell");
      }

      const created = (await res.json()) as ShellRecord;
      setShells((current) => {
        const withoutDuplicate = current.filter((shell) => shell.id !== created.id);
        return [...withoutDuplicate, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setNewName("");
      toast.success(created.name === name ? "Shell added" : "Shell already exists");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add shell");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (shell: ShellRecord) => {
    setEditingId(shell.id);
    setEditName(shell.name);
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
      const res = await fetch(`/api/shells/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update shell");
      }

      const updated = data as ShellRecord;
      setShells((current) =>
        current
          .map((shell) => (shell.id === id ? updated : shell))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
      toast.success("Shell updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update shell");
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (shell: ShellRecord) => {
    if (!confirm(`Remove "${shell.name}" from the shell library? This cannot be undone.`)) {
      return;
    }

    setRemovingId(shell.id);
    try {
      const res = await fetch(`/api/shells/${shell.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to remove shell");
      }

      setShells((current) => current.filter((item) => item.id !== shell.id));
      if (editingId === shell.id) cancelEdit();
      toast.success("Shell removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove shell");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      <form onSubmit={handleAdd} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
          <div className="space-y-1">
            <Label htmlFor="new-shell-device-type" className="text-xs text-stone-500">
              Device type
            </Label>
            <select
              id="new-shell-device-type"
              value={newDeviceModelId}
              onChange={(event) => setNewDeviceModelId(event.target.value)}
              className="h-9 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm"
            >
              {deviceModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-shell-name" className="text-xs text-stone-500">
              Shell name
            </Label>
            <Input
              id="new-shell-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Add shell..."
              className="h-9"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              disabled={adding || !newName.trim() || !newDeviceModelId}
              className="h-9 shrink-0"
            >
              <Plus className="h-4 w-4" />
              {adding ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </form>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <select
          value={modelFilter}
          onChange={(event) => setModelFilter(event.target.value)}
          className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm"
        >
          <option value="">All device types</option>
          {deviceModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shells..."
            className="h-9 pl-9"
          />
        </div>
      </div>

      <p className="text-xs text-stone-500">
        {loading
          ? "Loading shells..."
          : `${filtered.length} of ${shells.length} shell${shells.length === 1 ? "" : "s"}`}
      </p>

      {loading ? (
        <div className="grid min-w-0 gap-2 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 min-w-0 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
          {search || modelFilter ? "No shells match your filters." : "No shells yet."}
        </div>
      ) : (
        <div className="grid min-w-0 gap-2 lg:grid-cols-2">
          {filtered.map((shell) => {
            const isEditing = editingId === shell.id;
            const inUse = shell._count.ownedDevices > 0 || shell._count.wishlistItems > 0;

            return (
              <div
                key={shell.id}
                className="rounded-lg border border-stone-200 bg-white px-3 py-2"
              >
                {isEditing ? (
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      autoFocus
                      className="h-8 min-w-0 w-full sm:flex-1"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSaveEdit(shell.id);
                        }
                        if (event.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-2 sm:px-3"
                        onClick={() => void handleSaveEdit(shell.id)}
                        disabled={savingId === shell.id}
                        aria-label="Save shell"
                      >
                        {savingId === shell.id ? (
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
                ) : (
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium leading-snug text-stone-900">
                        {shell.name}
                      </p>
                      <p className="break-words text-xs leading-snug text-stone-500">
                        {shell.deviceModel.name}
                      </p>
                      {inUse && (
                        <p className="mt-0.5 text-[10px] font-medium text-tama-cyan">
                          In use
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 px-2"
                      onClick={() => startEdit(shell)}
                      aria-label={`Edit ${shell.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-8 shrink-0 px-2",
                        !inUse && "text-red-600 hover:text-red-700"
                      )}
                      disabled={removingId === shell.id}
                      onClick={() => void handleRemove(shell)}
                      aria-label={`Remove ${shell.name}`}
                      title={
                        inUse
                          ? "Remove collection and wishlist items before deleting"
                          : "Remove shell"
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
