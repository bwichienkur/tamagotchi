import { describe, expect, it } from "vitest";
import {
  getDeviceCardTitle,
  groupDeviceModelsBySeries,
  sortSeriesLabels,
} from "@/lib/device-series";

describe("device-series", () => {
  it("sorts known presets before custom franchise labels", () => {
    expect(
      sortSeriesLabels(["Hello Kitty", "Gen 2", "Gen 1 Limited Editions", "Gen 1"])
    ).toEqual(["Gen 1", "Gen 1 Limited Editions", "Gen 2", "Hello Kitty"]);
  });

  it("groups models by generation with ungrouped models first", () => {
    const groups = groupDeviceModelsBySeries([
      { name: "Original Tamagotchi", generation: "Gen 1", releaseYear: 2017 },
      { name: "Tamagotchi P1", generation: null, releaseYear: 1996 },
      { name: "Original Tamagotchi", generation: "Gen 2", releaseYear: 2018 },
      { name: "Kaette Kita! Chibi Tamagotchi", generation: "Chibi", releaseYear: 2017 },
    ]);

    expect(groups.map((group) => group.series)).toEqual([
      null,
      "Gen 1",
      "Gen 2",
      "Chibi",
    ]);
    expect(groups[0]?.models.map((model) => model.name)).toEqual(["Tamagotchi P1"]);
  });

  it("uses generation as the card title when names repeat in a family", () => {
    const models = [
      { name: "Original Tamagotchi", generation: "Gen 1" },
      { name: "Original Tamagotchi", generation: "Gen 2" },
    ];

    expect(getDeviceCardTitle(models[0], models)).toBe("Gen 1");
  });
});
