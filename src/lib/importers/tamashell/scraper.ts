import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { TamaShellShell } from "./index";
import { TAMASHELL_SECTIONED_PAGE_SLUGS } from "./catalog";

const TAMASHELL_ORIGIN = "https://www.tamashell.com";
const CONTENT_MARKER = "6617055158d1f12af2c75e0c";

const INVALID_SECTION_LABELS = new Set([
  "skip to content",
  "tamashell",
  "home",
  "gallery",
]);

function isValidSectionAnchor(
  anchorId: string,
  generation: string,
  pageSlug?: string
): boolean {
  if (!anchorId || !generation) return false;
  if (INVALID_SECTION_LABELS.has(generation.toLowerCase())) return false;
  if (generation.length < 2 || generation.length > 80) return false;
  if (pageSlug && TAMASHELL_SECTIONED_PAGE_SLUGS.includes(pageSlug as never)) {
    if (pageSlug === "original") return /^gen/i.test(anchorId);
    return true;
  }
  return /^gen/i.test(anchorId);
}

export interface TamaShellSection {
  generation: string;
  shells: TamaShellShell[];
}

export function normalizeImageUrl(src: string): string {
  const absolute = src.startsWith("//") ? `https:${src}` : src;
  const [base] = absolute.split("?");
  return `${base}?format=750w`;
}

function isShellImage(alt: string, rawSrc: string | undefined): rawSrc is string {
  if (!rawSrc || !alt || alt === "TamaShell") return false;
  if (!rawSrc.includes(CONTENT_MARKER)) return false;
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(alt)) return false;
  return true;
}

function pushShellImage(
  shells: TamaShellShell[],
  seen: Set<string>,
  alt: string,
  rawSrc: string,
  pageUrl: string,
  deviceName: string
) {
  const imageUrl = normalizeImageUrl(rawSrc);
  if (seen.has(imageUrl)) return;
  seen.add(imageUrl);

  shells.push({
    name: alt.replace(/\s+/g, " ").trim(),
    imageUrl,
    sourceUrl: pageUrl,
    deviceName,
  });
}

export function parseShellsFromHtml(
  html: string,
  pageUrl: string,
  deviceName: string
): TamaShellShell[] {
  const $ = cheerio.load(html);
  const shells: TamaShellShell[] = [];
  const seen = new Set<string>();

  $("img").each((_, el) => {
    const alt = ($(el).attr("alt") ?? "").replace(/\s+/g, " ").trim();
    const rawSrc = $(el).attr("data-src") ?? $(el).attr("src");
    if (!isShellImage(alt, rawSrc)) return;
    pushShellImage(shells, seen, alt, rawSrc, pageUrl, deviceName);
  });

  return shells;
}

function anchorPosition($: CheerioAPI, anchorId: string): number {
  const html = $.html();
  const marker = `id="${anchorId}"`;
  const position = html.indexOf(marker);
  return position === -1 ? Number.MAX_SAFE_INTEGER : position;
}

function discoverSections(
  $: CheerioAPI,
  pageSlug?: string
): Array<{ anchorId: string; generation: string }> {
  const sections: Array<{ anchorId: string; generation: string }> = [];
  const seen = new Set<string>();

  $("a[href*='#']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const anchorId = href.split("#").pop()?.trim();
    const generation = $(el).text().replace(/\|/g, "").trim();
    if (!anchorId || !generation || seen.has(anchorId)) return;
    if (!$(`#${anchorId}`).length) return;
    if (!isValidSectionAnchor(anchorId, generation, pageSlug)) return;
    seen.add(anchorId);
    sections.push({ anchorId, generation });
  });

  return sections.sort((a, b) => anchorPosition($, a.anchorId) - anchorPosition($, b.anchorId));
}

function parseShellsBetweenAnchors(
  html: string,
  pageUrl: string,
  deviceName: string,
  startAnchorId: string,
  endAnchorId?: string
): TamaShellShell[] {
  const startMarker = `id="${startAnchorId}"`;
  const startPos = html.indexOf(startMarker);
  if (startPos === -1) return [];

  const endPos = endAnchorId
    ? html.indexOf(`id="${endAnchorId}"`, startPos + startMarker.length)
    : html.length;
  const slice = html.slice(startPos, endPos === -1 ? html.length : endPos);
  return parseShellsFromHtml(slice, pageUrl, deviceName);
}

/** Parse generation-grouped shell sections when TamaShell uses in-page anchors. */
export function parseShellSectionsFromHtml(
  html: string,
  pageUrl: string,
  deviceName: string,
  pageSlug?: string
): TamaShellSection[] | null {
  const $ = cheerio.load(html);
  const sections = discoverSections($, pageSlug);
  if (sections.length < 2) return null;

  const fullHtml = $.html();
  return sections.map((section, index) => ({
    generation: section.generation,
    shells: parseShellsBetweenAnchors(
      fullHtml,
      pageUrl,
      deviceName,
      section.anchorId,
      sections[index + 1]?.anchorId
    ),
  }));
}

export async function fetchTamaShellPage(path: string): Promise<string> {
  const url = `${TAMASHELL_ORIGIN}${path}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "tamagotmi/1.0 (collection manager; +https://github.com/bwichienkur/tamagotchi)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}
