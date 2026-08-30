import { prisma } from "@/lib/prisma";
import { createSlug } from "@/lib/slug";

export async function findOrCreateDeviceSeries(familyId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = await prisma.deviceSeries.findUnique({
    where: {
      familyId_name: {
        familyId,
        name: trimmed,
      },
    },
  });
  if (existing) return existing;

  const family = await prisma.deviceFamily.findUnique({ where: { id: familyId } });
  if (!family) return null;

  const slugBase = createSlug(`${family.slug}-${trimmed}`);
  let slug = slugBase;
  let suffix = 2;
  while (await prisma.deviceSeries.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${suffix}`;
    suffix++;
  }

  return prisma.deviceSeries.create({
    data: {
      name: trimmed,
      slug,
      familyId,
    },
  });
}

export async function syncDeviceSeriesFromGenerations() {
  const models = await prisma.deviceModel.findMany({
    where: { generation: { not: null } },
    select: { id: true, familyId: true, generation: true, seriesId: true },
  });

  let linked = 0;
  for (const model of models) {
    const generation = model.generation?.trim();
    if (!generation) continue;

    const series = await findOrCreateDeviceSeries(model.familyId, generation);
    if (!series) continue;

    if (model.seriesId !== series.id) {
      await prisma.deviceModel.update({
        where: { id: model.id },
        data: { seriesId: series.id, generation: series.name },
      });
      linked++;
    }
  }

  return linked;
}

export async function applySeriesToDeviceModel(
  deviceModelId: string,
  seriesId: string | null | undefined
) {
  if (seriesId === undefined) return;

  if (!seriesId) {
    await prisma.deviceModel.update({
      where: { id: deviceModelId },
      data: { seriesId: null, generation: null },
    });
    return;
  }

  const series = await prisma.deviceSeries.findUnique({ where: { id: seriesId } });
  if (!series) return;

  await prisma.deviceModel.update({
    where: { id: deviceModelId },
    data: { seriesId: series.id, generation: series.name },
  });
}
