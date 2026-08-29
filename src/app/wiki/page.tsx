import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export default async function WikiIndexPage() {
  const pages = await prisma.wikiPage.findMany({
    where: { parentPageId: null },
    include: {
      children: true,
      deviceModel: true,
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">Wiki</h1>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-400">
            Browse
          </h2>
          <nav className="space-y-1">
            {pages.map((page) => (
              <div key={page.id}>
                <Link
                  href={`/wiki/${page.slug}`}
                  className="block rounded-lg px-2 py-1.5 text-sm hover:bg-stone-100"
                >
                  {page.title}
                </Link>
                {page.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/wiki/${child.slug}`}
                    className="block rounded-lg py-1 pl-6 text-sm text-stone-500 hover:bg-stone-100"
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
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{page.title}</h3>
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
