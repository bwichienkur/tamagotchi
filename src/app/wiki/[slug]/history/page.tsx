import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function WikiHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();
  const { slug } = await params;

  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: {
      revisions: {
        include: { editedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">History: {page.title}</h1>
        <Link href={`/wiki/${slug}`}>
          <Button variant="outline" size="sm">Back to page</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {page.revisions.map((revision) => (
          <div
            key={revision.id}
            className="rounded-xl border border-stone-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-stone-900">
                  {formatDate(revision.createdAt)}
                </p>
                <p className="text-sm text-stone-500">
                  {revision.editedBy?.name ?? revision.editedBy?.email ?? "Unknown"}
                </p>
                {revision.editSummary && (
                  <p className="mt-1 text-sm text-stone-600">
                    &ldquo;{revision.editSummary}&rdquo;
                  </p>
                )}
              </div>
              <Link href={`/wiki/${slug}/history/${revision.id}`}>
                <Button variant="ghost" size="sm">View</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
