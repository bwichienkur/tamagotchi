import { z } from "zod";

export type WikiSectionKind = "content" | "chart";

export interface WikiChartCell {
  text?: string;
  imageUrl?: string;
  rowSpan?: number;
}

export interface WikiChartRow {
  id: string;
  cells: WikiChartCell[];
}

export interface WikiChartGroup {
  id: string;
  title: string;
  rows: WikiChartRow[];
}

export interface WikiChartConfig {
  columns: string[];
  groups: WikiChartGroup[];
}

export interface WikiSection {
  id: string;
  title: string;
  content: string;
  kind?: WikiSectionKind;
  level?: number;
  chart?: WikiChartConfig;
  children?: WikiSection[];
}

export const DEFAULT_CHART_COLUMNS = [
  "Character",
  "Artwork",
  "Sprite",
  "Gender",
  "Special Condition",
  "Obtaining",
] as const;

export function createChartRow(columnCount: number): WikiChartRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    cells: Array.from({ length: columnCount }, () => ({})),
  };
}

export function createDefaultWikiChart(): WikiChartConfig {
  const columnCount = DEFAULT_CHART_COLUMNS.length;
  return {
    columns: [...DEFAULT_CHART_COLUMNS],
    groups: [
      {
        id: `group-${Date.now()}`,
        title: "New group",
        rows: [createChartRow(columnCount)],
      },
    ],
  };
}

export function createContentSection(title = "New Section"): WikiSection {
  return {
    id: `section-${Date.now()}`,
    title,
    kind: "content",
    content: "<p></p>",
    children: [],
  };
}

export function createChartSection(title = "New Chart"): WikiSection {
  return {
    id: `section-${Date.now()}`,
    title,
    kind: "chart",
    content: "",
    chart: createDefaultWikiChart(),
    children: [],
  };
}

export function createSubsection(title = "New Subsection"): WikiSection {
  return {
    id: `subsection-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    kind: "content",
    content: "<p></p>",
    children: [],
  };
}

export function duplicateSectionTree(section: WikiSection): WikiSection {
  const suffix = Math.random().toString(36).slice(2, 6);
  return {
    ...section,
    id: `section-${Date.now()}-${suffix}`,
    title: `${section.title} (copy)`,
    chart: section.chart
      ? {
          columns: [...section.chart.columns],
          groups: section.chart.groups.map((group) => ({
            ...group,
            id: `group-${Date.now()}-${suffix}-${group.id}`,
            rows: group.rows.map((row) => ({
              ...row,
              id: `row-${Date.now()}-${suffix}-${row.id}`,
              cells: row.cells.map((cell) => ({ ...cell })),
            })),
          })),
        }
      : undefined,
    children: section.children?.map((child) => duplicateSectionTree(child)),
  };
}

export function updateSectionById(
  sections: WikiSection[],
  sectionId: string,
  updates: Partial<WikiSection>
): WikiSection[] {
  return sections.map((section) => {
    if (section.id === sectionId) {
      return { ...section, ...updates };
    }
    if (!section.children?.length) return section;
    return {
      ...section,
      children: updateSectionById(section.children, sectionId, updates),
    };
  });
}

export function deleteSectionById(sections: WikiSection[], sectionId: string): WikiSection[] {
  return sections
    .filter((section) => section.id !== sectionId)
    .map((section) =>
      section.children?.length
        ? { ...section, children: deleteSectionById(section.children, sectionId) }
        : section
    );
}

export function addChildSection(
  sections: WikiSection[],
  parentId: string,
  child: WikiSection
): WikiSection[] {
  return sections.map((section) => {
    if (section.id === parentId) {
      return { ...section, children: [...(section.children ?? []), child] };
    }
    if (!section.children?.length) return section;
    return { ...section, children: addChildSection(section.children, parentId, child) };
  });
}

const wikiChartCellSchema = z.object({
  text: z.string().optional(),
  imageUrl: z.string().optional(),
  rowSpan: z.number().int().min(1).max(20).optional(),
});

const wikiChartRowSchema = z.object({
  id: z.string(),
  cells: z.array(wikiChartCellSchema),
});

const wikiChartGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  rows: z.array(wikiChartRowSchema),
});

const wikiChartConfigSchema = z.object({
  columns: z.array(z.string()),
  groups: z.array(wikiChartGroupSchema),
});

export const wikiSectionSchema: z.ZodType<WikiSection> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    kind: z.enum(["content", "chart"]).optional(),
    level: z.number().optional(),
    chart: wikiChartConfigSchema.optional(),
    children: z.array(wikiSectionSchema).optional(),
  })
);

export const wikiSectionsSchema = z.array(wikiSectionSchema);

export interface WikiSectionTocInput {
  id: string;
  title: string;
  level?: number;
  kind?: WikiSectionKind;
  chart?: WikiChartConfig;
  children?: WikiSectionTocInput[];
}

export function collectSectionTocItems(
  sections: WikiSectionTocInput[],
  depth = 0,
  items: { id: string; text: string; level: number }[] = []
) {
  for (const section of sections) {
    const baseLevel = section.level ?? 2;
    items.push({
      id: section.id,
      text: section.title,
      level: Math.min(baseLevel + depth, 4),
    });

    if (section.kind === "chart" && section.chart?.groups) {
      for (const group of section.chart.groups) {
        items.push({
          id: group.id,
          text: group.title,
          level: Math.min(baseLevel + depth + 1, 4),
        });
      }
    }

    if (section.children?.length) {
      collectSectionTocItems(section.children, depth + 1, items);
    }
  }
  return items;
}
