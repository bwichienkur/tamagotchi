import { describe, expect, it, afterEach } from "vitest";
import { getAuthSecret } from "@/lib/auth-secret";

describe("getAuthSecret", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("prefers tamagotchi_AUTH_SECRET over unprefixed AUTH_SECRET", () => {
    process.env.tamagotchi_AUTH_SECRET = "prefixed-secret";
    process.env.AUTH_SECRET = "plain-secret";
    expect(getAuthSecret()).toBe("prefixed-secret");
  });

  it("falls back to AUTH_SECRET when prefixed value is missing", () => {
    delete process.env.tamagotchi_AUTH_SECRET;
    process.env.AUTH_SECRET = "plain-secret";
    expect(getAuthSecret()).toBe("plain-secret");
  });
});
