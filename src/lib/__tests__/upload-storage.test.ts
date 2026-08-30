import { describe, expect, it, afterEach, vi } from "vitest";

describe("blob env", () => {
  const originalPrefixed = process.env.tamagotchi_BLOB_READ_WRITE_TOKEN;
  const originalUnprefixed = process.env.BLOB_READ_WRITE_TOKEN;

  afterEach(() => {
    if (originalPrefixed) process.env.tamagotchi_BLOB_READ_WRITE_TOKEN = originalPrefixed;
    else delete process.env.tamagotchi_BLOB_READ_WRITE_TOKEN;

    if (originalUnprefixed) process.env.BLOB_READ_WRITE_TOKEN = originalUnprefixed;
    else delete process.env.BLOB_READ_WRITE_TOKEN;

    vi.resetModules();
  });

  it("prefers unprefixed BLOB_READ_WRITE_TOKEN (Vercel standard)", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel-token";
    process.env.tamagotchi_BLOB_READ_WRITE_TOKEN = "prefixed-token";

    const { getBlobReadWriteToken, hasBlobStorage } = await import("../blob-env");
    expect(getBlobReadWriteToken()).toBe("vercel-token");
    expect(hasBlobStorage()).toBe(true);
  });

  it("falls back to prefixed token when unprefixed is missing", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.tamagotchi_BLOB_READ_WRITE_TOKEN = "prefixed-token";

    const { getBlobReadWriteToken } = await import("../blob-env");
    expect(getBlobReadWriteToken()).toBe("prefixed-token");
    expect(process.env.BLOB_READ_WRITE_TOKEN).toBe("prefixed-token");
  });
});

describe("resolveImageMimeType", () => {
  it("accepts images with empty MIME type when extension is valid", async () => {
    const { resolveImageMimeType } = await import("../upload-storage");
    const file = new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "" });
    expect(resolveImageMimeType(file)).toBe("image/jpeg");
  });

  it("sniffs JPEG from file bytes when type and extension are missing", async () => {
    const { resolveImageMimeType } = await import("../upload-storage");
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    const file = new File([bytes], "IMG_0001", { type: "" });
    expect(resolveImageMimeType(file, Buffer.from(bytes))).toBe("image/jpeg");
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
    expect(resolveImageMimeType(file, Buffer.from([1, 2, 3]))).toBeNull();
  });
});
