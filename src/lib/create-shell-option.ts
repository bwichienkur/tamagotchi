import type { ComboboxOption } from "@/components/forms/creatable-combobox";

export async function createShellOption(
  deviceModelId: string,
  name: string
): Promise<ComboboxOption | null> {
  const res = await fetch("/api/shells", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ deviceModelId, name }),
  });

  if (!res.ok) {
    return null;
  }

  const shell = (await res.json()) as { id: string; name: string };
  return { value: shell.id, label: shell.name };
}
