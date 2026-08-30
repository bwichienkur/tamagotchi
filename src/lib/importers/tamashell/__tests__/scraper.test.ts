import { describe, expect, it } from "vitest";
import {
  parseShellSectionsFromHtml,
  parseShellsFromHtml,
} from "@/lib/importers/tamashell/scraper";

const SAMPLE_HTML = `
  <img alt="TamaShell" src="//images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/header.png" />
  <img alt="Green Squares" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/green.jpg" />
  <img alt="Green Squares" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/green.jpg" />
  <img alt="Pink Stars" src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/pinkstars.jpg" />
`;

const SECTION_HTML = `
  <p>
    <a href="/original/#gen1">Gen 1</a> |
    <a href="/original/#gen1lmd">Gen 1 Limited Editions</a>
  </p>
  <div id="gen1"></div>
  <img alt="Aqua" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/aqua.jpg" />
  <img alt="Blue" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/blue.jpg" />
  <div id="gen1lmd"></div>
  <img alt="SDCC 2018" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/sdcc.jpg" />
`;

describe("parseShellsFromHtml", () => {
  it("extracts unique shell images with names", () => {
    const shells = parseShellsFromHtml(
      SAMPLE_HTML,
      "https://www.tamashell.com/connectionv1",
      "Tamagotchi Connection v1"
    );

    expect(shells).toHaveLength(2);
    expect(shells[0].name).toBe("Green Squares");
    expect(shells[0].imageUrl).toContain("format=750w");
    expect(shells[1].name).toBe("Pink Stars");
  });
});

describe("parseShellSectionsFromHtml", () => {
  it("groups shells by TamaShell in-page generation anchors", () => {
    const sections = parseShellSectionsFromHtml(
      SECTION_HTML,
      "https://www.tamashell.com/original",
      "Original Tamagotchi"
    );

    expect(sections).not.toBeNull();
    expect(sections).toHaveLength(2);
    expect(sections?.[0].generation).toBe("Gen 1");
    expect(sections?.[0].shells.map((shell) => shell.name)).toEqual(["Aqua", "Blue"]);
    expect(sections?.[1].generation).toBe("Gen 1 Limited Editions");
    expect(sections?.[1].shells.map((shell) => shell.name)).toEqual(["SDCC 2018"]);
  });

  it("returns null when the page has no generation sections", () => {
    const sections = parseShellSectionsFromHtml(
      SAMPLE_HTML,
      "https://www.tamashell.com/connectionv1",
      "Tamagotchi Connection v1"
    );

    expect(sections).toBeNull();
  });
});
