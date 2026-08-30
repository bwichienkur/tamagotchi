import { prisma } from "@/lib/prisma";
import { createSlug } from "@/lib/slug";
import { getOrCreateDefaultFamilyId } from "@/lib/device-family";
import type { OwnedDeviceInput } from "@/lib/owned-device-schema";

export async function resolveDeviceModelId(
  data: Pick<OwnedDeviceInput, "deviceModelId" | "newDeviceModelName">
): Promise<string | undefined> {
  let deviceModelId = data.deviceModelId;

  if (data.newDeviceModelName) {
    const slug = createSlug(data.newDeviceModelName);
    const existing = await prisma.deviceModel.findUnique({ where: { slug } });
    if (existing) {
      deviceModelId = existing.id;
    } else {
      const created = await prisma.deviceModel.create({
        data: {
          name: data.newDeviceModelName,
          slug,
          familyId: await getOrCreateDefaultFamilyId(),
        },
      });
      deviceModelId = created.id;
    }
  }

  return deviceModelId;
}

export async function resolveShellId(
  deviceModelId: string,
  data: Pick<OwnedDeviceInput, "shellId" | "newShellName">
): Promise<string | null | undefined> {
  if (data.shellId === null) return null;
  if (data.shellId) return data.shellId;

  if (data.newShellName) {
    const shellSlug = createSlug(data.newShellName);
    const existingShell = await prisma.shell.findUnique({
      where: { deviceModelId_slug: { deviceModelId, slug: shellSlug } },
    });
    if (existingShell) return existingShell.id;

    const createdShell = await prisma.shell.create({
      data: {
        deviceModelId,
        name: data.newShellName,
        slug: shellSlug,
      },
    });
    return createdShell.id;
  }

  return undefined;
}
