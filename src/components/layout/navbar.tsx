"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Library,
  BookOpen,
  Shell,
  Plus,
  Settings,
  Menu,
} from "lucide-react";
import { GlobalSearch } from "@/components/search/global-search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/collection", label: "My Collection", icon: Package },
  { href: "/devices", label: "Device Library", icon: Library },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/shells", label: "Shell Catalog", icon: Shell },
];

interface NavbarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tama-cyan text-white shadow-sm">
              <span className="text-lg font-bold">T</span>
            </div>
            <span className="hidden font-bold text-stone-800 sm:inline">TamaDex</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-tama-cyan/10 text-tama-cyan"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden flex-1 justify-center md:flex">
            <GlobalSearch />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/collection/add">
              <Button size="sm" className="hidden sm:flex">
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <Button size="icon" className="sm:hidden">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            {user ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tama-pink/20 text-xs font-bold text-tama-pink">
                {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="border-t border-stone-100 px-4 py-2 md:hidden">
          <GlobalSearch />
        </div>

        {mobileOpen && (
          <nav className="border-t border-stone-100 bg-white px-4 py-2 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "bg-tama-cyan/10 text-tama-cyan"
                    : "text-stone-600"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium",
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                  ? "text-tama-cyan"
                  : "text-stone-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(" ")[0]}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
