export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface WikiSectionInput {
  id: string;
  title: string;
  level?: number;
  children?: Array<{ id: string; title: string }>;
}

export function extractTocFromSections(sections: WikiSectionInput[]): TocItem[] {
  const items: TocItem[] = [];
  for (const section of sections) {
    items.push({ id: section.id, text: section.title, level: section.level ?? 2 });
    if (section.children) {
      for (const child of section.children) {
        items.push({ id: child.id, text: child.title, level: 3 });
      }
    }
  }
  return items;
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
