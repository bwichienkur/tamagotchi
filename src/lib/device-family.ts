import { prisma } from "@/lib/prisma";

export async function getOrCreateDefaultFamilyId() {
  const modernFamily = await prisma.deviceFamily.findFirst({
    where: { slug: "modern" },
  });
  if (modernFamily) return modernFamily.id;

  const otherFamily = await prisma.deviceFamily.findFirst({
    where: { slug: "other" },
  });
  if (otherFamily) return otherFamily.id;

  const created = await prisma.deviceFamily.create({
    data: { name: "Other", slug: "other", sortOrder: 99 },
  });
  return created.id;
}

export async function resolveFamilyIdForCreate(familyId?: string | null) {
  if (familyId) {
    const family = await prisma.deviceFamily.findUnique({ where: { id: familyId } });
    if (family) return family.id;
  }

  return getOrCreateDefaultFamilyId();
}
