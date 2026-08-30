import { describe, expect, it } from "vitest";
import { inferGenerationFromSlug } from "@/lib/backfill-device-generations";

describe("inferGenerationFromSlug", () => {
  it("maps original section slugs to generation labels", () => {
    expect(inferGenerationFromSlug("original-gen-1", "original")).toBe("Gen 1");
    expect(inferGenerationFromSlug("original-gen-1-limited-editions", "original")).toBe(
      "Gen 1 Limited Editions"
    );
    expect(inferGenerationFromSlug("20mini-chibi", "20mini")).toBe("Chibi");
  });

  it("returns null for unrelated slugs", () => {
    expect(inferGenerationFromSlug("tamagotchi-p1", "gen1")).toBeNull();
    expect(inferGenerationFromSlug("connectionv1", "connectionv1")).toBeNull();
  });
});
