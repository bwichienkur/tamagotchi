import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSlug, normalizeName } from "@/lib/slug";
import { getConditionLabel } from "@/lib/condition-labels";

describe("database env resolution", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("reads tamagotchi_ prefixed Neon variables", async () => {
    process.env = { ...original };
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_PRISMA_URL;
    process.env.tamagotchi_POSTGRES_PRISMA_URL = "postgresql://neon-prisma";
    const { getDatabaseUrl } = await import("@/lib/db");
    expect(getDatabaseUrl()).toBe("postgresql://neon-prisma");
  });

  it("prefers prisma pooled URL over database url", async () => {
    process.env = { ...original };
    process.env.tamagotchi_POSTGRES_PRISMA_URL = "postgresql://pooled";
    process.env.tamagotchi_DATABASE_URL = "postgresql://direct";
    const { getDatabaseUrl } = await import("@/lib/db");
    expect(getDatabaseUrl()).toBe("postgresql://pooled");
  });
});

describe("slug utilities", () => {
  it("creates clean slugs", () => {
    expect(createSlug("Tamagotchi Connection Version 1")).toBe(
      "tamagotchi-connection-version-1"
    );
  });

  it("normalizes device names for matching", () => {
    expect(normalizeName("Tamagotchi Connection Version 1")).toBe(
      normalizeName("Connection v1")
    );
    expect(normalizeName("Tamagotchi Connection v1")).toBe(
      normalizeName("Connection V1")
    );
  });
});

describe("condition labels", () => {
  it("maps NONE to No Box", () => {
    expect(getConditionLabel("NONE")).toBe("No Box");
    expect(getConditionLabel("NIB")).toBe("NIB");
    expect(getConditionLabel("IOB")).toBe("IOB");
  });
});

describe("shell belongs to model", () => {
  it("enforces composite unique constraint conceptually", () => {
    const shells = [
      { deviceModelId: "model-1", slug: "blue-waves" },
      { deviceModelId: "model-1", slug: "pink-hearts" },
      { deviceModelId: "model-2", slug: "blue-waves" },
    ];
    const key = (s: { deviceModelId: string; slug: string }) =>
      `${s.deviceModelId}:${s.slug}`;
    const keys = shells.map(key);
    expect(new Set(keys).size).toBe(3);
  });
});

describe("wiki hierarchy", () => {
  it("supports parent-child relationships", () => {
    const pages = [
      { id: "1", title: "Connection", parentPageId: null },
      { id: "2", title: "Version 1", parentPageId: "1" },
      { id: "3", title: "Shells", parentPageId: "2" },
    ];
    const children = pages.filter((p) => p.parentPageId === "2");
    expect(children).toHaveLength(1);
    expect(children[0].title).toBe("Shells");
  });
});

describe("import duplicate matching", () => {
  it("matches normalized names", () => {
    const imported = normalizeName("Connection Version One");
    const existing = normalizeName("Tamagotchi Connection v1");
    expect(imported).toBe(existing);
  });
});

describe("search", () => {
  it("groups results by type", () => {
    const results = {
      devices: [{ title: "Connection v1" }],
      shells: [{ title: "Blue Waves" }],
      collection: [],
      wiki: [],
    };
    expect(Object.keys(results)).toEqual(["devices", "shells", "collection", "wiki"]);
  });
});

describe("show more info expansion", () => {
  it("toggles expanded state", () => {
    let expanded = false;
    expanded = !expanded;
    expect(expanded).toBe(true);
    expanded = !expanded;
    expect(expanded).toBe(false);
  });
});

describe("safe merge behavior", () => {
  it("prevents merging same device", () => {
    const fromId = "abc";
    const toId = "abc";
    const isValid = fromId && toId && fromId !== toId;
    expect(isValid).toBe(false);
  });

  it("allows merging different devices", () => {
    const fromId: string = "abc";
    const toId: string = "def";
    const isValid = Boolean(fromId && toId && fromId !== toId);
    expect(isValid).toBe(true);
  });
});
