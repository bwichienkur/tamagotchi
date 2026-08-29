import { describe, expect, it, afterEach, vi } from "vitest";

describe("upload storage env", () => {
  const originalPrefixed = process.env.tamagotchi_BLOB_READ_WRITE_TOKEN;
  const originalUnprefixed = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    if (originalPrefixed) process.env.tamagotchi_BLOB_READ_WRITE_TOKEN = originalPrefixed;
    else delete process.env.tamagotchi_BLOB_READ_WRITE_TOKEN;

    if (originalUnprefixed) process.env.BLOB_READ_WRITE_TOKEN = originalUnprefixed;
    else delete process.env.BLOB_READ_WRITE_TOKEN;

    vi.resetModules();
  });

  it("reads prefixed blob token", async () => {
    process.env.tamagotchi_BLOB_READ_WRITE_TOKEN = "test-token";
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const { getBlobReadWriteToken, hasBlobStorage } = await import("../upload-storage");
    expect(getBlobReadWriteToken()).toBe("test-token");
    expect(hasBlobStorage()).toBe(true);
  });

  it("falls back to unprefixed blob token", async () => {
    delete process.env.tamagotchi_BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_READ_WRITE_TOKEN = "fallback-token";

    const { getBlobReadWriteToken } = await import("../upload-storage");
    expect(getBlobReadWriteToken()).toBe("fallback-token");
  });
});

describe("resolveImageMimeType", () => {
  it("accepts images with empty MIME type when extension is valid", async () => {
    const { resolveImageMimeType } = await import("../upload-storage");
    const file = new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "" });
    expect(resolveImageMimeType(file)).toBe("image/jpeg");
  });

  it("accepts application/octet-stream with png extension", async () => {
    const { resolveImageMimeType } = await import("../upload-storage");
    const file = new File([new Uint8Array([1, 2, 3])], "scan.PNG", {
      type: "application/octet-stream",
    });
    expect(resolveImageMimeType(file)).toBe("image/png");
  });

  it("rejects unknown file types", async () => {
    const { resolveImageMimeType } = await import("../upload-storage");
    const file = new File([new Uint8Array([1, 2, 3])], "notes.txt", { type: "text/plain" });
    expect(resolveImageMimeType(file)).toBeNull();
  });
});
