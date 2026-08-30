import { describe, expect, it, vi } from "vitest";
import { isMissingUserUploadTableError } from "../ensure-upload-storage";

describe("isMissingUserUploadTableError", () => {
  it("detects missing UserUpload table errors", () => {
    expect(
      isMissingUserUploadTableError(new Error('relation "UserUpload" does not exist'))
    ).toBe(true);
    expect(isMissingUserUploadTableError(new Error("table userupload does not exist"))).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isMissingUserUploadTableError(new Error("Unauthorized"))).toBe(false);
    expect(isMissingUserUploadTableError(new Error('relation "User" does not exist'))).toBe(false);
  });
});

describe("saveToBlob token", () => {
  it("passes explicit token to put", async () => {
    vi.resetModules();
    process.env.BLOB_READ_WRITE_TOKEN = "test-blob-token";
    delete process.env.VERCEL;

    const put = vi.fn().mockResolvedValue({ url: "https://blob.example/photo.jpg" });
    vi.doMock("@vercel/blob", () => ({ put }));

    const { saveUploadedImage } = await import("../upload-storage");
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd8, 0x00])], "photo.jpg", {
      type: "image/jpeg",
    });

    const url = await saveUploadedImage(file, "user-1");
    expect(url).toBe("https://blob.example/photo.jpg");
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\//),
      expect.any(Buffer),
      expect.objectContaining({ token: "test-blob-token", access: "public" })
    );

    vi.doUnmock("@vercel/blob");
    vi.resetModules();
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });
});
