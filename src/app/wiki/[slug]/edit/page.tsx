import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { WikiEditClient } from "@/components/wiki/wiki-edit-client";
import { WikiSection } from "@/components/wiki/wiki-content";

export default async function WikiEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();
  const { slug } = await params;

  const page = await prisma.wikiPage.findUnique({ where: { slug } });
  if (!page) notFound();

  return (
    <WikiEditClient
      slug={slug}
      initialTitle={page.title}
      initialSummary={page.summary ?? ""}
      initialSections={(page.sections as unknown as WikiSection[]) ?? []}
    />
  );
}
