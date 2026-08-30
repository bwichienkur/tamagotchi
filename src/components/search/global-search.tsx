"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Gamepad2, Shell, BookOpen, Package } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "device" | "shell" | "collection" | "wiki";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  image?: string | null;
  excerpt?: string;
}

interface SearchResponse {
  devices: SearchResult[];
  shells: SearchResult[];
  collection: SearchResult[];
  wiki: SearchResult[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const hasResults =
    results &&
    (results.devices.length > 0 ||
      results.shells.length > 0 ||
      results.collection.length > 0 ||
      results.wiki.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Tamagotchi database"
        className="flex h-9 w-full items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-400 shadow-sm transition-colors hover:border-stone-300 sm:h-10 sm:px-4"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left text-xs leading-none sm:text-sm">
          <span className="sm:hidden">Search...</span>
          <span className="hidden sm:inline">Search Tamagotchi database...</span>
        </span>
        <kbd className="hidden shrink-0 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-stone-500 lg:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen} modal>
        {open && (
          <DialogContent className="max-w-2xl overflow-hidden p-0">
          <Command shouldFilter={false} className="rounded-2xl">
            <div className="flex items-center border-b border-stone-200 px-4">
              <Search className="mr-2 h-4 w-4 shrink-0 text-stone-400" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search devices, shells, collection, wiki..."
                className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
              />
            </div>
            <Command.List className="max-h-96 overflow-auto p-2">
              {loading && (
                <div className="py-6 text-center text-sm text-stone-500">Searching...</div>
              )}
              {!loading && query && !hasResults && (
                <Command.Empty className="py-6 text-center text-sm text-stone-500">
                  No results found.
                </Command.Empty>
              )}
              {results?.devices && results.devices.length > 0 && (
                <ResultGroup
                  heading="Devices"
                  icon={<Gamepad2 className="h-4 w-4" />}
                  items={results.devices}
                  onSelect={navigate}
                  query={query}
                />
              )}
              {results?.shells && results.shells.length > 0 && (
                <ResultGroup
                  heading="Shells"
                  icon={<Shell className="h-4 w-4" />}
                  items={results.shells}
                  onSelect={navigate}
                  query={query}
                />
              )}
              {results?.collection && results.collection.length > 0 && (
                <ResultGroup
                  heading="My Collection"
                  icon={<Package className="h-4 w-4" />}
                  items={results.collection}
                  onSelect={navigate}
                  query={query}
                />
              )}
              {results?.wiki && results.wiki.length > 0 && (
                <ResultGroup
                  heading="Wiki Pages"
                  icon={<BookOpen className="h-4 w-4" />}
                  items={results.wiki}
                  onSelect={navigate}
                  query={query}
                />
              )}
            </Command.List>
          </Command>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function ResultGroup({
  heading,
  icon,
  items,
  onSelect,
  query,
}: {
  heading: string;
  icon: React.ReactNode;
  items: SearchResult[];
  onSelect: (href: string) => void;
  query: string;
}) {
  return (
    <Command.Group
      heading={
        <span className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
          {icon}
          {heading}
        </span>
      }
    >
      {items.map((item) => (
        <Command.Item
          key={item.id}
          value={item.id}
          onSelect={() => onSelect(item.href)}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 aria-selected:bg-tama-cyan/10"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-900">
              <Highlight text={item.title} query={query} />
            </p>
            {item.subtitle && (
              <p className="truncate text-xs text-stone-500">{item.subtitle}</p>
            )}
            {item.excerpt && (
              <p className="mt-0.5 truncate text-xs text-stone-400">{item.excerpt}</p>
            )}
          </div>
        </Command.Item>
      ))}
    </Command.Group>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded bg-tama-yellow/40 px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
