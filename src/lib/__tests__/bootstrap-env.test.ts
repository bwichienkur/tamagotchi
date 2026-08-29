import { describe, expect, it, afterEach } from "vitest";
import { bootstrapAuthEnv } from "@/lib/bootstrap-env";

describe("bootstrapAuthEnv", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("copies tamagotchi_AUTH_SECRET to AUTH_SECRET", () => {
    process.env.tamagotchi_AUTH_SECRET = "prefixed-secret";
    delete process.env.AUTH_SECRET;
    bootstrapAuthEnv();
    expect(process.env.AUTH_SECRET).toBe("prefixed-secret");
  });

  it("sets AUTH_URL from VERCEL_URL when missing", () => {
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.tamagotchi_AUTH_URL;
    process.env.VERCEL_URL = "tamagotmi.vercel.app";
    bootstrapAuthEnv();
    expect(process.env.AUTH_URL).toBe("https://tamagotmi.vercel.app");
  });
});
