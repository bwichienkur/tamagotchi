import { collectSectionTocItems } from "@/lib/wiki-sections";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface WikiSectionInput {
  id: string;
  title: string;
  level?: number;
  kind?: "content" | "chart";
  chart?: import("@/lib/wiki-sections").WikiChartConfig;
  children?: WikiSectionInput[];
}

export function extractTocFromSections(sections: WikiSectionInput[]): TocItem[] {
  return collectSectionTocItems(sections);
}

export function extractTocFromHtml(html: string): TocItem[] {
  const items: TocItem[] = [];
  const regex = /<h([234])[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/h[234]>/gi;
  let match;
  let i = 0;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const id = match[2] || `section-${i}`;
    const text = match[3].replace(/<[^>]+>/g, "");
    items.push({ id, text, level });
    i++;
  }
  return items;
}

export { collectSectionTocItems };
