import { describe, expect, it } from "vitest";
import {
  buildSectionDeviceName,
  parseShellSectionsFromHtml,
  parseShellsFromHtml,
} from "@/lib/importers/tamashell/scraper";

const SAMPLE_HTML = `
  <img alt="TamaShell" src="//images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/header.png" />
  <img alt="Green Squares" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/green.jpg" />
  <img alt="Pink Stars" src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/pinkstars.jpg" />
`;

const ANCHOR_SECTION_HTML = `
  <a href="#skip">Skip to Content</a>
  <p>
    <a href="/original/#gen1">Gen 1</a> |
    <a href="/original/#gen1lmd">Gen 1 Limited Editions</a>
  </p>
  <div id="gen1"></div>
  <img alt="Aqua" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/aqua.jpg" />
  <div id="gen1lmd"></div>
  <img alt="SDCC 2018" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/sdcc.jpg" />
`;

const GALLERY_SECTION_HTML = `
  <section data-test="page-section" data-sqsp-section="gallery">
    <figure class="gallery-grid-item">
      <img alt="Aqua" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/aqua.jpg" />
    </figure>
  </section>
  <section data-test="page-section" data-sqsp-section="gallery">
    <figure class="gallery-grid-item">
      <img alt="Special Asian Series - Australia" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/australia.jpg" />
    </figure>
  </section>
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
    expect(shells[1].name).toBe("Pink Stars");
  });
});

describe("buildSectionDeviceName", () => {
  it("combines page and section labels", () => {
    expect(buildSectionDeviceName("Tamagotchi P1", "Special Edition")).toBe(
      "Tamagotchi P1 Special Edition"
    );
    expect(buildSectionDeviceName("Tamagotchi P1", null)).toBe("Tamagotchi P1");
  });
});

describe("parseShellSectionsFromHtml", () => {
  it("groups shells by in-page anchor sections", () => {
    const sections = parseShellSectionsFromHtml(
      ANCHOR_SECTION_HTML,
      "https://www.tamashell.com/original",
      "Original Tamagotchi",
      "original"
    );

    expect(sections).not.toBeNull();
    expect(sections).toHaveLength(2);
    expect(sections?.[0].sectionLabel).toBe("Gen 1");
    expect(sections?.[0].shells.map((shell) => shell.name)).toEqual(["Aqua"]);
    expect(sections?.[1].sectionLabel).toBe("Gen 1 Limited Editions");
    expect(sections?.[1].shells.map((shell) => shell.name)).toEqual(["SDCC 2018"]);
  });

  it("splits multi-gallery pages into section devices", () => {
    const sections = parseShellSectionsFromHtml(
      GALLERY_SECTION_HTML,
      "https://www.tamashell.com/gen1",
      "Tamagotchi P1",
      "gen1"
    );

    expect(sections).toHaveLength(2);
    expect(sections?.[0].sectionLabel).toBeNull();
    expect(sections?.[0].shells.map((shell) => shell.name)).toEqual(["Aqua"]);
    expect(sections?.[1].sectionLabel).toBe("Special Edition");
    expect(sections?.[1].shells.map((shell) => shell.name)).toEqual([
      "Special Asian Series - Australia",
    ]);
  });

  it("returns null when the page has no sections", () => {
    const sections = parseShellSectionsFromHtml(
      SAMPLE_HTML,
      "https://www.tamashell.com/connectionv1",
      "Tamagotchi Connection v1"
    );

    expect(sections).toBeNull();
  });

  it("parses franchise sections on licensed nano pages", () => {
    const licensedHtml = `
      <a href="/licensed/#HK">Hello Kitty</a>
      <a href="/licensed/#OP">One Piece</a>
      <div id="HK"></div>
      <img alt="Red Bow" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/hk.jpg" />
      <div id="OP"></div>
      <img alt="Luffy" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/op.jpg" />
    `;

    const sections = parseShellSectionsFromHtml(
      licensedHtml,
      "https://www.tamashell.com/licensed",
      "Tamagotchi Nanos",
      "licensed"
    );

    expect(sections).toHaveLength(2);
    expect(sections?.[0].sectionLabel).toBe("Hello Kitty");
    expect(sections?.[1].sectionLabel).toBe("One Piece");
  });
});
