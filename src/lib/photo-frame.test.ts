import { describe, expect, it } from "vitest";
import { buildPhotoFramesForSave } from "@/lib/photo-frame";

describe("buildPhotoFramesForSave", () => {
  it("persists primary framing when a primary photo exists", () => {
    const result = buildPhotoFramesForSave("https://example.com/photo.jpg", [], {
      primary: { x: 30, y: 40, zoom: 1.5 },
    });

    expect(result).toEqual({
      primary: { x: 30, y: 40, zoom: 1.5 },
    });
  });

  it("persists default primary framing when no custom frame was set", () => {
    const result = buildPhotoFramesForSave("https://example.com/photo.jpg", [], {});

    expect(result).toEqual({
      primary: { x: 50, y: 50, zoom: 1 },
    });
  });

  it("aligns additional photo frames with photo indexes", () => {
    const result = buildPhotoFramesForSave(
      "https://example.com/primary.jpg",
      ["https://example.com/a.jpg", "https://example.com/b.jpg"],
      {
        primary: { x: 50, y: 50, zoom: 1 },
        additional: {
          "1": { x: 20, y: 80, zoom: 2 },
        },
      }
    );

    expect(result).toEqual({
      primary: { x: 50, y: 50, zoom: 1 },
      additional: {
        "0": { x: 50, y: 50, zoom: 1 },
        "1": { x: 20, y: 80, zoom: 2 },
      },
    });
  });
});
