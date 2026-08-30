/** Series / generation labels used on TamaShell for Classic Remakes and similar groupings. */
export const DEVICE_GENERATION_PRESETS = [
  "Gen 1",
  "Gen 1 Limited Editions",
  "Gen 1 China Exclusives",
  "Gen 2",
  "Gen 2 Limited Editions",
  "Gen 3",
  "Gen 3 Limited Editions",
  "Chibi",
  "Connection 20th Anniversary",
] as const;

export type DeviceGenerationPreset = (typeof DEVICE_GENERATION_PRESETS)[number];
