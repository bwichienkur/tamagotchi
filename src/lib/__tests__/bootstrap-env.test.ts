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

  it("does not set AUTH_URL from VERCEL_URL", () => {
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.tamagotchi_AUTH_URL;
    process.env.VERCEL_URL = "tamagotchi-abc123-bwichienkurs-projects.vercel.app";
    bootstrapAuthEnv();
    expect(process.env.AUTH_URL).toBeUndefined();
    expect(process.env.NEXTAUTH_URL).toBeUndefined();
  });

  it("copies tamagotchi_AUTH_URL when explicitly configured", () => {
    process.env.tamagotchi_AUTH_URL = "https://tamagotmi.vercel.app";
    delete process.env.AUTH_URL;
    bootstrapAuthEnv();
    expect(process.env.AUTH_URL).toBe("https://tamagotmi.vercel.app");
  });
});
