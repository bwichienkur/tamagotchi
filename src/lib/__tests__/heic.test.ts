import { describe, expect, it } from "vitest";
import { isHeicBuffer, isHeicFileMeta, isHeicMimeType } from "../heic";

// Minimal HEIC ftyp header (not a valid image, just for detection tests)
function makeHeicHeader(): Buffer {
  const buf = Buffer.alloc(12);
  buf.write("....", 0); // size
  buf.write("ftyp", 4);
  buf.write("heic", 8);
  return buf;
}

describe("heic detection", () => {
  it("detects HEIC mime type", () => {
    expect(isHeicMimeType("image/heic")).toBe(true);
    expect(isHeicMimeType("image/heif")).toBe(true);
    expect(isHeicMimeType("image/jpeg")).toBe(false);
  });

  it("detects HEIC filenames", () => {
    expect(isHeicFileMeta("IMG_1234.HEIC", "")).toBe(true);
    expect(isHeicFileMeta("photo.heif", "")).toBe(true);
    expect(isHeicFileMeta("photo.jpg", "")).toBe(false);
  });

  it("detects HEIC from ftyp header bytes", () => {
    expect(isHeicBuffer(makeHeicHeader())).toBe(true);
    expect(isHeicBuffer(Buffer.from([0xff, 0xd8, 0xff]))).toBe(false);
  });
});
