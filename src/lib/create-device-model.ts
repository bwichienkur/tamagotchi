import type { ComboboxOption } from "@/components/forms/creatable-combobox";

export async function createDeviceModelOption(
  name: string,
  familyId?: string
): Promise<ComboboxOption | null> {
  const res = await fetch("/api/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, familyId }),
  });

  if (res.status === 401) {
    throw new Error("Please sign in to create device types.");
  }

  if (!res.ok) {
    return null;
  }

  const model = (await res.json()) as { id: string; name: string; familyId?: string };
  return { value: model.id, label: model.name };
}
