import {
  DEVICE_GENERATION_PRESETS,
  type DeviceGenerationPreset,
} from "@/lib/device-generations";

export interface DeviceSeriesGroup<T> {
  series: string | null;
  models: T[];
}

export function sortSeriesLabels(labels: string[]): string[] {
  return [...labels].sort((a, b) => {
    const ai = DEVICE_GENERATION_PRESETS.indexOf(a as DeviceGenerationPreset);
    const bi = DEVICE_GENERATION_PRESETS.indexOf(b as DeviceGenerationPreset);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function groupDeviceModelsBySeries<
  T extends { generation?: string | null; name: string; releaseYear?: number | null },
>(models: T[]): DeviceSeriesGroup<T>[] {
  const bySeries = new Map<string | null, T[]>();

  for (const model of models) {
    const series = model.generation?.trim() || null;
    const bucket = bySeries.get(series) ?? [];
    bucket.push(model);
    bySeries.set(series, bucket);
  }

  const sortModels = (items: T[]) =>
    [...items].sort((a, b) => {
      const yearDiff = (a.releaseYear ?? 9999) - (b.releaseYear ?? 9999);
      if (yearDiff !== 0) return yearDiff;
      return a.name.localeCompare(b.name);
    });

  const groups: DeviceSeriesGroup<T>[] = [];

  if (bySeries.has(null)) {
    groups.push({ series: null, models: sortModels(bySeries.get(null)!) });
    bySeries.delete(null);
  }

  for (const series of sortSeriesLabels([...bySeries.keys()] as string[])) {
    groups.push({ series, models: sortModels(bySeries.get(series)!) });
  }

  return groups;
}

export function hasDuplicateDeviceNames<T extends { name: string }>(models: T[]): boolean {
  const counts = new Map<string, number>();
  for (const model of models) {
    counts.set(model.name, (counts.get(model.name) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count > 1);
}

export function getDeviceCardTitle<T extends { name: string; generation?: string | null }>(
  model: T,
  familyModels: T[]
): string {
  if (hasDuplicateDeviceNames(familyModels) && model.generation) {
    return model.generation;
  }
  return model.name;
}

export function getDeviceCardSubtitle<T extends { name: string; generation?: string | null }>(
  model: T,
  familyModels: T[],
  series: string | null
): string | null {
  if (series) {
    return model.name;
  }
  if (hasDuplicateDeviceNames(familyModels) && model.generation) {
    return model.name;
  }
  if (model.generation) {
    return model.generation;
  }
  return null;
}
