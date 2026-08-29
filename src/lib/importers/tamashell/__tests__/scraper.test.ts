import { describe, expect, it } from "vitest";
import { parseShellsFromHtml } from "@/lib/importers/tamashell/scraper";

const SAMPLE_HTML = `
  <img alt="TamaShell" src="//images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/header.png" />
  <img alt="Green Squares" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/green.jpg" />
  <img alt="Green Squares" data-src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/green.jpg" />
  <img alt="Pink Stars" src="https://images.squarespace-cdn.com/content/v1/6617055158d1f12af2c75e0c/pinkstars.jpg" />
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
