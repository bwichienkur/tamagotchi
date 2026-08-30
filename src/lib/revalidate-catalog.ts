import { revalidatePath, revalidateTag } from "next/cache";

/** Bust cached device catalog data after manage / API mutations. */
export function revalidateDeviceCatalog() {
  try {
    revalidateTag("device-catalog", "max");
    revalidatePath("/devices");
    revalidatePath("/collection");
    revalidatePath("/manage/device-types");
    revalidatePath("/manage/shells");
  } catch {
    // No-op outside Next.js request context (CLI scripts, seeds, etc.)
  }
}
