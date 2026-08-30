import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { TamaShellShell } from "./index";

const TAMASHELL_ORIGIN = "https://www.tamashell.com";
const CONTENT_MARKER = "6617055158d1f12af2c75e0c";

const INVALID_SECTION_LABELS = new Set([
  "skip to content",
  "tamashell",
  "home",
  "gallery",
  "back",
]);

/** Default labels for pages with multiple galleries but no in-page nav. */
const GALLERY_FALLBACK_LABELS = ["Special Edition", "Limited Edition", "Exclusives"];

export interface TamaShellSection {
  /** Section label from TamaShell; omitted for the primary gallery on a page. */
  sectionLabel: string | null;
  shells: TamaShellShell[];
}

function isValidSectionAnchor(anchorId: string, label: string): boolean {
  if (!anchorId || !label) return false;
  if (INVALID_SECTION_LABELS.has(label.toLowerCase())) return false;
  if (label.length < 2 || label.length > 80) return false;
  if (anchorId === "page") return false;
  return true;
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

function discoverAnchorLabels($: CheerioAPI): string[] {
  const sections: Array<{ anchorId: string; label: string }> = [];
  const seen = new Set<string>();

  $("a[href*='#']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const anchorId = href.split("#").pop()?.trim();
    const label = $(el).text().replace(/\|/g, "").trim();
    if (!anchorId || !label || seen.has(anchorId)) return;
    if (!$(`#${anchorId}`).length) return;
    if (!isValidSectionAnchor(anchorId, label)) return;
    seen.add(anchorId);
    sections.push({ anchorId, label });
  });

  return sections
    .sort((a, b) => anchorPosition($, a.anchorId) - anchorPosition($, b.anchorId))
    .map((section) => section.label);
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

function discoverAnchorSections(
  $: CheerioAPI,
  fullHtml: string,
  pageUrl: string,
  deviceName: string
): TamaShellSection[] | null {
  const anchors: Array<{ anchorId: string; label: string }> = [];
  const seen = new Set<string>();

  $("a[href*='#']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const anchorId = href.split("#").pop()?.trim();
    const label = $(el).text().replace(/\|/g, "").trim();
    if (!anchorId || !label || seen.has(anchorId)) return;
    if (!$(`#${anchorId}`).length) return;
    if (!isValidSectionAnchor(anchorId, label)) return;
    seen.add(anchorId);
    anchors.push({ anchorId, label });
  });

  if (anchors.length < 2) return null;

  anchors.sort((a, b) => anchorPosition($, a.anchorId) - anchorPosition($, b.anchorId));

  return anchors.map((anchor, index) => ({
    sectionLabel: anchor.label,
    shells: parseShellsBetweenAnchors(
      fullHtml,
      pageUrl,
      deviceName,
      anchor.anchorId,
      anchors[index + 1]?.anchorId
    ),
  }));
}

function splitHtmlByGallerySections(html: string): string[] {
  const parts = html.split(/(?=<section[^>]*data-test="page-section")/i);
  const galleries: string[] = [];

  for (const part of parts) {
    if (!/data-sqsp-section="gallery"/i.test(part)) continue;
    galleries.push(part);
  }

  return galleries;
}

function labelForGalleryIndex(
  index: number,
  anchorLabels: string[],
  galleryCount: number
): string | null {
  if (galleryCount === 1) return null;

  if (anchorLabels.length === galleryCount) {
    return anchorLabels[index] ?? null;
  }

  if (anchorLabels.length + 1 === galleryCount) {
    if (index === 0) return null;
    return anchorLabels[index - 1] ?? GALLERY_FALLBACK_LABELS[index - 1] ?? `Section ${index + 1}`;
  }

  if (index === 0) return null;
  if (anchorLabels[index]) return anchorLabels[index];
  return GALLERY_FALLBACK_LABELS[index - 1] ?? `Section ${index + 1}`;
}

function parseGallerySections(
  html: string,
  pageUrl: string,
  deviceName: string,
  anchorLabels: string[]
): TamaShellSection[] | null {
  const galleryChunks = splitHtmlByGallerySections(html);
  if (galleryChunks.length === 0) return null;

  const sections = galleryChunks
    .map((chunk, index) => ({
      sectionLabel: labelForGalleryIndex(index, anchorLabels, galleryChunks.length),
      shells: parseShellsFromHtml(chunk, pageUrl, deviceName),
    }))
    .filter((section) => section.shells.length > 0);

  if (sections.length === 0) return null;
  if (sections.length === 1 && !sections[0].sectionLabel) return null;

  return sections;
}

/** Build device display name from catalog page title and optional section label. */
export function buildSectionDeviceName(pageName: string, sectionLabel: string | null): string {
  if (!sectionLabel) return pageName;
  if (pageName.toLowerCase().includes(sectionLabel.toLowerCase())) return pageName;
  return `${pageName} ${sectionLabel}`;
}

/** Build stable slug for a section device on a TamaShell catalog page. */
export function buildSectionDeviceSlug(pageSlug: string, sectionLabel: string | null): string {
  if (!sectionLabel) return pageSlug;
  return `${pageSlug}-${sectionLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parse TamaShell page sections. Each section becomes its own device when a page
 * has multiple galleries or in-page anchor groups.
 */
export function parseShellSectionsFromHtml(
  html: string,
  pageUrl: string,
  deviceName: string,
  _pageSlug?: string
): TamaShellSection[] | null {
  const $ = cheerio.load(html);
  const fullHtml = $.html();
  const anchorLabels = discoverAnchorLabels($);

  const gallerySections = parseGallerySections(fullHtml, pageUrl, deviceName, anchorLabels);
  if (gallerySections) return gallerySections;

  const anchorSections = discoverAnchorSections($, fullHtml, pageUrl, deviceName);
  if (anchorSections) return anchorSections;

  return null;
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
