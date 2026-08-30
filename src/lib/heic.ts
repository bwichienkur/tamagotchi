const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "mif1", "msf1"]);

export function isHeicBuffer(buffer: ArrayBuffer | Buffer | Uint8Array): boolean {
  const bytes =
    buffer instanceof Buffer
      ? buffer
      : Buffer.from(buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer);

  if (bytes.length < 12) return false;

  const boxType = bytes.toString("ascii", 4, 8);
  if (boxType !== "ftyp") return false;

  const brand = bytes.toString("ascii", 8, 12).toLowerCase();
  return HEIC_BRANDS.has(brand);
}

export function isHeicMimeType(type: string): boolean {
  const normalized = type.toLowerCase();
  return normalized === "image/heic" || normalized === "image/heif";
}

export function isHeicFilename(name: string): boolean {
  return /\.hei[cf]$/i.test(name);
}

export function isHeicFileMeta(name: string, type: string): boolean {
  return isHeicMimeType(type) || isHeicFilename(name);
}
