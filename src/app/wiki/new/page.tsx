import { requireAuth } from "@/lib/session";
import { withDatabase } from "@/lib/db-query";
import { prisma } from "@/lib/prisma";
import { WikiCreateClient } from "@/components/wiki/wiki-create-client";

export default async function WikiNewPage() {
  await requireAuth();

  const parentPages = await withDatabase(() =>
    prisma.wikiPage.findMany({
      where: { parentPageId: null },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    })
  );

  return <WikiCreateClient parentPages={parentPages} />;
}
