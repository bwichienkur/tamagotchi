import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { withDatabase } from "@/lib/db-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function WikiIndexPage() {
  const session = await auth();

  const pages = await withDatabase(() =>
    prisma.wikiPage.findMany({
    where: { parentPageId: null },
    include: {
      children: true,
      deviceModel: true,
    },
    orderBy: { title: "asc" },
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Wiki"
        subtitle="Learn about shells, models, and everything Tamagotchi"
        actions={
          session?.user ? (
            <Link href="/wiki/new">
              <Button className="rounded-full">
                <Plus className="h-4 w-4" />
                New Page
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="cute-card p-4">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-tama-pink">
            Browse
          </h2>
          <nav className="space-y-1">
            {pages.map((page) => (
              <div key={page.id}>
                <Link
                  href={`/wiki/${page.slug}`}
                  className="block rounded-xl px-2.5 py-1.5 text-sm font-medium hover:bg-tama-cyan/10 hover:text-tama-cyan"
                >
                  {page.title}
                </Link>
                {page.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/wiki/${child.slug}`}
                    className="block rounded-xl py-1 pl-6 text-sm text-stone-500 hover:bg-tama-pink/10 hover:text-tama-pink"
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="grid gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <Link key={page.id} href={`/wiki/${page.slug}`}>
              <Card className="cute-card h-full">
                <CardContent className="pt-6">
                  <h3 className="font-display font-bold">{page.title}</h3>
                  {page.summary && (
                    <p className="mt-2 text-sm text-stone-500 line-clamp-2">
                      {page.summary}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
