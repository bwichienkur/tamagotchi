"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MANAGE_LINKS = [
  { href: "/manage", label: "Overview", exact: true },
  { href: "/manage/device-types", label: "Device Types" },
  { href: "/manage/shells", label: "Shells" },
];

interface ManageNavProps {
  className?: string;
}

export function ManageNav({ className }: ManageNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("mb-8 flex flex-wrap gap-2", className)}>
      {MANAGE_LINKS.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all",
              isActive
                ? "bg-gradient-to-r from-tama-cyan/20 to-tama-pink/15 text-tama-cyan shadow-sm"
                : "text-stone-600 hover:bg-white hover:text-stone-900"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
