"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Library,
  BookOpen,
  Plus,
  Settings,
  Menu,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { GlobalSearch } from "@/components/search/global-search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { APP_NAME } from "@/lib/app-name";
import { AppLogo } from "@/components/ui/app-logo";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/collection", label: "My Collection", icon: Package },
  { href: "/devices", label: "Device Library", icon: Library },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/60 bg-cream/80 shadow-sm shadow-tama-cyan/5 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-0 sm:h-16">
            <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2.5">
              <AppLogo size="sm" />
              <span className="font-display hidden text-lg font-extrabold text-stone-800 sm:inline">
                {APP_NAME}
              </span>
            </Link>

            <nav className="relative z-10 hidden items-center gap-1 lg:flex">
              {NAV_ITEMS.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold transition-all",
                    pathname.startsWith(item.href)
                      ? "bg-gradient-to-r from-tama-cyan/20 to-tama-pink/15 text-tama-cyan shadow-sm"
                      : "text-stone-600 hover:bg-white/80 hover:text-stone-900"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="relative z-10 order-last w-full min-w-0 md:order-none md:flex-1 md:px-2">
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
              <Button variant="ghost" size="icon" asChild>
                <Link href="/settings" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              {user ? (
                <div className="flex items-center gap-1">
                  <Link
                    href="/settings"
                    className="hidden rounded-full px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-white/80 hover:text-stone-900 md:inline"
                  >
                    Settings
                  </Link>
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
            {user && (
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname.startsWith("/settings")
                    ? "bg-tama-cyan/10 text-tama-cyan"
                    : "text-stone-600"
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            )}
          </nav>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/80 bg-white/90 shadow-[0_-4px_20px_-4px_rgba(78,205,196,0.15)] backdrop-blur-md md:hidden">
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
          {user && (
            <Link
              href="/settings"
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
                pathname.startsWith("/settings") ? "text-tama-cyan" : "text-stone-400"
              )}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
