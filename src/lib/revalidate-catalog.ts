import { revalidatePath, revalidateTag } from "next/cache";

/** Bust cached device catalog data after manage / API mutations. */
export function revalidateDeviceCatalog() {
  revalidateTag("device-catalog", "max");
  revalidatePath("/devices");
  revalidatePath("/collection");
  revalidatePath("/manage/device-types");
  revalidatePath("/shells");
}
