"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComboboxOption } from "@/components/forms/creatable-combobox";
import { createShellOption } from "@/lib/create-shell-option";
import { toast } from "sonner";

export function useShellOptions(deviceModelId?: string) {
  const [shellOptions, setShellOptions] = useState<ComboboxOption[]>([]);
  const [loadingShells, setLoadingShells] = useState(false);

  const loadShells = useCallback(async (modelId: string) => {
    setLoadingShells(true);
    try {
      const res = await fetch(`/api/shells?deviceModelId=${modelId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load shells");
      const data = (await res.json()) as Array<{ id: string; name: string }>;
      setShellOptions(
        data.map((shell) => ({ value: shell.id, label: shell.name }))
      );
    } catch {
      setShellOptions([]);
    } finally {
      setLoadingShells(false);
    }
  }, []);

  useEffect(() => {
    if (!deviceModelId) {
      setShellOptions([]);
      return;
    }
    void loadShells(deviceModelId);
  }, [deviceModelId, loadShells]);

  const createShell = useCallback(
    async (label: string, modelId?: string) => {
      const targetModelId = modelId ?? deviceModelId;
      if (!targetModelId) {
        toast.error("Select a device type before adding a shell");
        return null;
      }

      const created = await createShellOption(targetModelId, label);
      if (!created) {
        toast.error("Failed to save shell");
        return null;
      }

      setShellOptions((current) =>
        current.some((shell) => shell.value === created.value)
          ? current
          : [...current, created].sort((a, b) => a.label.localeCompare(b.label))
      );
      return created;
    },
    [deviceModelId]
  );

  return {
    shellOptions,
    loadingShells,
    createShell,
    setShellOptions,
  };
}
