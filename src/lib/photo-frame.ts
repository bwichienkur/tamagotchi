import type { CSSProperties } from "react";

export interface PhotoFrame {
  x: number;
  y: number;
  zoom: number;
}

export interface DevicePhotoFrames {
  primary?: PhotoFrame;
  additional?: Record<string, PhotoFrame>;
}

export const DEFAULT_PHOTO_FRAME: PhotoFrame = { x: 50, y: 50, zoom: 1 };

export function normalizePhotoFrame(frame?: PhotoFrame | null): PhotoFrame {
  if (!frame) return { ...DEFAULT_PHOTO_FRAME };
  return {
    x: clamp(frame.x ?? 50, 0, 100),
    y: clamp(frame.y ?? 50, 0, 100),
    zoom: clamp(frame.zoom ?? 1, 1, 3),
  };
}

export function parsePhotoFrames(value: unknown): DevicePhotoFrames {
  if (!value || typeof value !== "object") return {};
  const data = value as DevicePhotoFrames;
  return {
    primary: data.primary ? normalizePhotoFrame(data.primary) : undefined,
    additional: data.additional
      ? Object.fromEntries(
          Object.entries(data.additional).map(([key, frame]) => [
            key,
            normalizePhotoFrame(frame),
          ])
        )
      : undefined,
  };
}

export function getPrimaryPhotoFrame(frames?: DevicePhotoFrames | null): PhotoFrame {
  return normalizePhotoFrame(frames?.primary);
}

export function getAdditionalPhotoFrame(
  frames: DevicePhotoFrames | null | undefined,
  index: number
): PhotoFrame {
  return normalizePhotoFrame(frames?.additional?.[String(index)]);
}

export function photoFrameStyle(frame?: PhotoFrame | null): CSSProperties {
  const normalized = normalizePhotoFrame(frame);
  return {
    objectPosition: `${normalized.x}% ${normalized.y}%`,
    transform: `scale(${normalized.zoom})`,
    transformOrigin: `${normalized.x}% ${normalized.y}%`,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
