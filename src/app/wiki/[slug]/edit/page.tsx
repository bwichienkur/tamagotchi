import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { WikiEditClient } from "@/components/wiki/wiki-edit-client";
import { WikiSection } from "@/components/wiki/wiki-content";
import type { WikiDeviceDetails } from "@/components/wiki/wiki-device-details-editor";

export default async function WikiEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();
  const { slug } = await params;

  const page = await prisma.wikiPage.findUnique({
    where: { slug },
    include: {
      deviceModel: {
        include: {
          family: { select: { name: true } },
          properties: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!page) notFound();

  const deviceModel: WikiDeviceDetails | null = page.deviceModel
    ? {
        id: page.deviceModel.id,
        name: page.deviceModel.name,
        heroImage: page.deviceModel.heroImage,
        manufacturer: page.deviceModel.manufacturer,
        releaseYear: page.deviceModel.releaseYear,
        regions: page.deviceModel.regions,
        family: page.deviceModel.family,
        properties: page.deviceModel.properties.map((property) => ({
          id: property.id,
          group: property.group,
          label: property.label,
          value: property.value,
          sortOrder: property.sortOrder,
        })),
      }
    : null;

  return (
    <WikiEditClient
      slug={slug}
      initialTitle={page.title}
      initialSummary={page.summary ?? ""}
      initialCoverImage={page.coverImage}
      initialSections={(page.sections as unknown as WikiSection[]) ?? []}
      deviceModel={deviceModel}
    />
  );
}
