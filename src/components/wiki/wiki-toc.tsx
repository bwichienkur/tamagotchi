"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/wiki-toc";

export type { TocItem };

interface WikiTableOfContentsProps {
  items: TocItem[];
  className?: string;
  mobile?: boolean;
}

export function WikiTableOfContents({
  items,
  className,
  mobile = false,
}: WikiTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileOpen(false);
    }
  };

  if (items.length === 0) return null;

  const content = (
    <nav aria-label="Table of contents">
      <ol className="space-y-1 text-sm">
        {items.map((item, index) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
          >
            <button
              type="button"
              onClick={() => handleClick(item.id)}
              className={cn(
                "w-full text-left transition-colors hover:text-tama-cyan",
                activeId === item.id
                  ? "font-medium text-tama-cyan"
                  : "text-stone-600"
              )}
            >
              <span className="mr-1 text-stone-400">{index + 1}.</span>
              {item.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );

  if (mobile) {
    return (
      <div className={cn("rounded-xl border border-stone-200 bg-white p-4 lg:hidden", className)}>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between font-semibold text-stone-800"
        >
          Contents
          <span className="text-stone-400">{mobileOpen ? "▴" : "▾"}</span>
        </button>
        {mobileOpen && <div className="mt-3">{content}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "hidden rounded-xl border border-stone-200 bg-white p-5 lg:block lg:sticky lg:top-24",
        className
      )}
    >
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-400">
        Contents
      </h2>
      {content}
    </div>
  );
}

