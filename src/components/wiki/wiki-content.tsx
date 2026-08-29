"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface WikiContentProps {
  html: string;
  className?: string;
}

export function WikiContent({ html, className }: WikiContentProps) {
  const processedHtml = processWikiLinks(html);

  return (
    <article
      className={cn(
        "wiki-content prose prose-stone max-w-none",
        "prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:text-stone-900",
        "prose-h2:text-2xl prose-h2:border-b prose-h2:border-stone-200 prose-h2:pb-2 prose-h2:mt-10",
        "prose-h3:text-xl prose-h4:text-lg",
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
  return html.replace(
    /\[\[([^\]]+)\]\]/g,
    (_, pageName: string) => {
      const slug = pageName
        .toLowerCase()
        .replace(/tamagotchi\s*/gi, "tamagotchi-")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      return `<a href="/wiki/${slug}" class="wiki-link" data-wiki="${pageName}">${pageName}</a>`;
    }
  );
}

interface WikiSection {
  id: string;
  title: string;
  content: string;
  level?: number;
  children?: WikiSection[];
}

interface WikiSectionsContentProps {
  sections: WikiSection[];
  className?: string;
}

export function WikiSectionsContent({ sections, className }: WikiSectionsContentProps) {
  return (
    <div className={className}>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="mb-10">
          {section.level === 3 ? (
            <h3 className="wiki-section-heading mb-4 font-display text-xl font-bold text-stone-900">{section.title}</h3>
          ) : (
            <h2 className="wiki-section-heading mb-4 scroll-mt-24 pb-2 font-display text-2xl font-bold text-stone-900">
              {section.title}
            </h2>
          )}
          <WikiContent html={section.content} />
          {section.children?.map((child) => (
            <div key={child.id} id={child.id} className="mt-6 scroll-mt-24">
              <h3 className="mb-3 text-xl font-semibold text-stone-900">{child.title}</h3>
              <WikiContent html={child.content} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export type { WikiSection };
