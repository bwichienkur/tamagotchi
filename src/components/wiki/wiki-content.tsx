"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WikiSection } from "@/lib/wiki-sections";
import { WikiChartView } from "@/components/wiki/wiki-chart-view";

interface WikiContentProps {
  html: string;
  className?: string;
}

export function WikiContent({ html, className }: WikiContentProps) {
  const processedHtml = processWikiLinks(html);

  if (!processedHtml.trim() || processedHtml === "<p></p>") {
    return null;
  }

  return (
    <article
      className={cn(
        "wiki-content prose prose-stone max-w-none",
        "prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:text-stone-900",
        "prose-h2:text-2xl prose-h2:border-b prose-h2:border-stone-200 prose-h2:pb-2 prose-h2:mt-10",
        "prose-h3:text-xl prose-h4:text-lg",
        "prose-ul:list-disc prose-ol:list-decimal prose-li:my-1",
        "prose-a:text-tama-cyan prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-tama-pink prose-blockquote:bg-tama-pink/5 prose-blockquote:py-1 prose-blockquote:rounded-r-lg",
        "prose-table:border prose-table:border-stone-200",
        "prose-th:bg-stone-50 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-stone-200",
        "prose-img:rounded-xl prose-img:shadow-sm",
        className
      )}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}

function processWikiLinks(html: string): string {
  return html.replace(/\[\[([^\]]+)\]\]/g, (_, pageName: string) => {
    const slug = pageName
      .toLowerCase()
      .replace(/tamagotchi\s*/gi, "tamagotchi-")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    return `<a href="/wiki/${slug}" class="wiki-link" data-wiki="${pageName}">${pageName}</a>`;
  });
}

interface WikiSectionsContentProps {
  sections: WikiSection[];
  className?: string;
}

function sectionHeadingClass(depth: number, level?: number) {
  if (depth === 0) {
    return level === 3
      ? "wiki-section-heading mb-4 font-display text-xl font-bold text-stone-900"
      : "wiki-section-heading mb-4 scroll-mt-24 pb-2 font-display text-2xl font-bold text-stone-900";
  }
  if (depth === 1) {
    return "wiki-section-heading mb-3 scroll-mt-24 font-display text-xl font-bold text-stone-900";
  }
  return "wiki-section-heading mb-2 scroll-mt-24 font-display text-lg font-bold text-stone-900";
}

function WikiSectionBlock({ section, depth }: { section: WikiSection; depth: number }) {
  const HeadingTag = depth === 0 ? (section.level === 3 ? "h3" : "h2") : depth === 1 ? "h3" : "h4";
  const isChart = section.kind === "chart" && section.chart;

  return (
    <>
      <HeadingTag id={section.id} className={sectionHeadingClass(depth, section.level)}>
        {section.title}
      </HeadingTag>
      {!isChart && <WikiContent html={section.content} />}
      {isChart ? <WikiChartView chart={section.chart!} className="mt-2" /> : null}
      {section.children?.map((child) => (
        <div key={child.id} className={cn(depth === 0 ? "mt-6" : "mt-4", "scroll-mt-24")}>
          <WikiSectionBlock section={child} depth={depth + 1} />
        </div>
      ))}
    </>
  );
}

export function WikiSectionsContent({ sections, className }: WikiSectionsContentProps) {
  return (
    <div className={className}>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
          <WikiSectionBlock section={section} depth={0} />
        </section>
      ))}
    </div>
  );
}

export type { WikiSection };
