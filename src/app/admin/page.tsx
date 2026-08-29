import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TamaShellImportClient } from "@/components/admin/tamashell-import";

export default async function AdminPage() {
  await requireAdmin();

  const [modelCount, shellCount, wikiCount, userCount] = await Promise.all([
    prisma.deviceModel.count(),
    prisma.shell.count(),
    prisma.wikiPage.count(),
    prisma.user.count(),
  ]);

  const sections = [
    { href: "/admin/device-models", label: "Device Models", count: modelCount },
    { href: "/admin/shells", label: "Shells", count: shellCount },
    { href: "/admin/wiki", label: "Wiki Pages", count: wikiCount },
    { href: "/admin/users", label: "Users", count: userCount },
    { href: "/admin/import/tamashell", label: "Imports" },
    { href: "/admin/duplicates", label: "Duplicate Review" },
    { href: "/admin/export", label: "Export Collection" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">Admin</h1>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-semibold">{section.label}</h3>
                {section.count !== undefined && (
                  <p className="text-2xl font-bold text-tama-cyan">{section.count}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
