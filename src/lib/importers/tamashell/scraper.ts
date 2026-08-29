import * as cheerio from "cheerio";
import type { TamaShellShell } from "./index";

const TAMASHELL_ORIGIN = "https://www.tamashell.com";
const CONTENT_MARKER = "6617055158d1f12af2c75e0c";

export function normalizeImageUrl(src: string): string {
  const absolute = src.startsWith("//") ? `https:${src}` : src;
  const [base] = absolute.split("?");
  return `${base}?format=750w`;
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

    if (!rawSrc || !alt || alt === "TamaShell") return;
    if (!rawSrc.includes(CONTENT_MARKER)) return;
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(alt)) return;

    const imageUrl = normalizeImageUrl(rawSrc);
    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    shells.push({
      name: alt,
      imageUrl,
      sourceUrl: pageUrl,
      deviceName,
    });
  });

  return shells;
}

export async function fetchTamaShellPage(path: string): Promise<string> {
  const url = `${TAMASHELL_ORIGIN}${path}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TamaDex/1.0 (collection manager; +https://github.com/bwichienkur/tamagotchi)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}
