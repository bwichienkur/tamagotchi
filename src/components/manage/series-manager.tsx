"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FamilyOption {
  id: string;
  name: string;
}

interface SeriesRecord {
  id: string;
  name: string;
  slug: string;
  family: { id: string; name: string; slug: string };
  _count: { deviceModels: number };
}

interface SeriesManagerProps {
  families: FamilyOption[];
}

export function SeriesManager({ families }: SeriesManagerProps) {
  const [seriesList, setSeriesList] = useState<SeriesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [newName, setNewName] = useState("");
  const [newFamilyId, setNewFamilyId] = useState(families[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFamilyId, setEditFamilyId] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadSeries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/series", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load series");
      const data = (await res.json()) as SeriesRecord[];
      setSeriesList(data);
    } catch {
      toast.error("Failed to load series");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return seriesList.filter((series) => {
      if (familyFilter && series.family.id !== familyFilter) return false;
      if (!query) return true;
      return (
        series.name.toLowerCase().includes(query) ||
        series.family.name.toLowerCase().includes(query) ||
        series.slug.toLowerCase().includes(query)
      );
    });
  }, [seriesList, search, familyFilter]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name || !newFamilyId) return;

    setAdding(true);
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, familyId: newFamilyId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to add series");
      }

      const created = (await res.json()) as SeriesRecord;
      setSeriesList((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== created.id);
        return [...withoutDuplicate, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setNewName("");
      toast.success(created.name === name ? "Series added" : "Series already exists");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add series");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (series: SeriesRecord) => {
    setEditingId(series.id);
    setEditName(series.name);
    setEditFamilyId(series.family.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditFamilyId("");
  };

  const handleSaveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch(`/api/series/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, familyId: editFamilyId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update series");
      }

      const updated = data as SeriesRecord;
      setSeriesList((current) =>
        current
          .map((item) => (item.id === id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
      toast.success("Series updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update series");
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (series: SeriesRecord) => {
    if (!confirm(`Remove "${series.name}" from the series library? This cannot be undone.`)) {
      return;
    }

    setRemovingId(series.id);
    try {
      const res = await fetch(`/api/series/${series.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to remove series");
      }

      setSeriesList((current) => current.filter((item) => item.id !== series.id));
      if (editingId === series.id) cancelEdit();
      toast.success("Series removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove series");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      <form onSubmit={handleAdd} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
          <div className="space-y-1">
            <Label htmlFor="new-series-family" className="text-xs text-stone-500">
              Family
            </Label>
            <select
              id="new-series-family"
              value={newFamilyId}
              onChange={(event) => setNewFamilyId(event.target.value)}
              className="h-9 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm"
            >
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-series-name" className="text-xs text-stone-500">
              Series name
            </Label>
            <Input
              id="new-series-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Gen 1, Hello Kitty"
              className="h-9"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              disabled={adding || !newName.trim() || !newFamilyId}
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
          value={familyFilter}
          onChange={(event) => setFamilyFilter(event.target.value)}
          className="h-9 rounded-xl border border-stone-200 bg-white px-3 text-sm"
        >
          <option value="">All families</option>
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search series..."
            className="h-9 pl-9"
          />
        </div>
      </div>

      <p className="text-xs text-stone-500">
        {loading
          ? "Loading series..."
          : `${filtered.length} of ${seriesList.length} series`}
      </p>

      {loading ? (
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 min-w-0 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
          {search || familyFilter ? "No series match your filters." : "No series yet."}
        </div>
      ) : (
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((series) => {
            const isEditing = editingId === series.id;
            const inUse = series._count.deviceModels > 0;

            return (
              <div
                key={series.id}
                className="min-w-0 overflow-hidden rounded-lg border border-stone-200 bg-white px-3 py-2"
              >
                {isEditing ? (
                  <div className="flex min-w-0 flex-col gap-2">
                    <select
                      value={editFamilyId}
                      onChange={(event) => setEditFamilyId(event.target.value)}
                      className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-sm"
                    >
                      {families.map((family) => (
                        <option key={family.id} value={family.id}>
                          {family.name}
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
                            void handleSaveEdit(series.id);
                          }
                          if (event.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="flex shrink-0 gap-2 self-end sm:self-auto">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 px-2 sm:px-3"
                          onClick={() => void handleSaveEdit(series.id)}
                          disabled={savingId === series.id}
                          aria-label="Save series"
                        >
                          {savingId === series.id ? (
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
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{series.name}</p>
                      <p className="truncate text-xs text-stone-500">{series.family.name}</p>
                      <p className="mt-0.5 text-[10px] text-stone-400">
                        {series._count.deviceModels} device type
                        {series._count.deviceModels === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 px-2"
                      onClick={() => startEdit(series)}
                      aria-label={`Edit ${series.name}`}
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
                      disabled={removingId === series.id}
                      onClick={() => void handleRemove(series)}
                      aria-label={`Remove ${series.name}`}
                      title={
                        inUse
                          ? "Reassign device types before deleting"
                          : "Remove series"
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
