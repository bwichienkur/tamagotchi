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
import { signOut } from "next-auth/react";
import { APP_NAME } from "@/lib/app-name";

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
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
            <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tama-cyan text-white shadow-sm">
                <span className="text-lg font-bold">t</span>
              </div>
              <span className="hidden font-bold text-stone-800 sm:inline">{APP_NAME}</span>
            </Link>

            <nav className="relative z-10 hidden items-center gap-1 lg:flex">
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

            <div className="relative z-10 hidden min-w-0 flex-1 px-2 md:block">
              <GlobalSearch />
            </div>

            <div className="relative z-10 ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/collection/add">
                  <Plus className="h-4 w-4" />
                  Add
                </Link>
              </Button>
              <Button size="icon" className="sm:hidden" asChild>
                <Link href="/collection/add" aria-label="Add device">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex" asChild>
                <Link href="/settings" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              {user ? (
                <div className="flex items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tama-pink/20 text-xs font-bold text-tama-pink">
                    {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden text-xs sm:inline-flex"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="border-t border-stone-100 px-3 pb-3 pt-2 md:hidden">
            <GlobalSearch />
          </div>
        </div>

        {mobileOpen && (
          <nav className="relative z-10 border-t border-stone-100 bg-white px-4 py-2 lg:hidden">
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
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
