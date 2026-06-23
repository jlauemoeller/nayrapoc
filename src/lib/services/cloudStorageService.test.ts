import { describe, it, expect } from "vitest";
import { CloudStorageService } from "@lib/services/cloudStorageService";

const minioConfigured = !!process.env.OBJECT_STORAGE_ENDPOINT && !!process.env.OBJECT_STORAGE_BUCKET;

describe("CloudStorageService", () => {
  describe("keyBelongsToAccount", () => {
    it("returns true for keys under the account prefix", () => {
      expect(CloudStorageService.keyBelongsToAccount("account/abc/123.png", "abc")).toBe(true);
    });

    it("returns false for keys under a different account", () => {
      expect(CloudStorageService.keyBelongsToAccount("account/xyz/123.png", "abc")).toBe(false);
    });

    it("returns false for malformed keys", () => {
      expect(CloudStorageService.keyBelongsToAccount("123.png", "abc")).toBe(false);
    });
  });

  // These validation paths short-circuit before any network/config access, so they run
  // without Minio configured.
  describe("presignUpload validation", () => {
    it("rejects unsupported content types", async () => {
      const result = await CloudStorageService.presignUpload({
        accountId: "test-account",
        contentType: "application/pdf",
        contentLength: 1000
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error).toMatch(/not an allowed file type/);
    });

    it("rejects images over the 5 MB image cap", async () => {
      const result = await CloudStorageService.presignUpload({
        accountId: "test-account",
        contentType: "image/png",
        contentLength: 6 * 1024 * 1024
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error).toMatch(/must be less than/);
    });

    it("rejects videos over the 50 MB video cap", async () => {
      const result = await CloudStorageService.presignUpload({
        accountId: "test-account",
        contentType: "video/mp4",
        contentLength: 51 * 1024 * 1024
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error).toMatch(/must be less than/);
    });

    it("rejects empty files", async () => {
      const result = await CloudStorageService.presignUpload({
        accountId: "test-account",
        contentType: "image/png",
        contentLength: 0
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error).toMatch(/must be less than/);
    });
  });

  describe.skipIf(!minioConfigured)("presignUpload (integration)", () => {
    it.each([
      { contentType: "image/webp", ext: "webp" },
      { contentType: "video/mp4", ext: "mp4" },
      { contentType: "audio/mpeg", ext: "mp3" }
    ])("presigns $contentType with a .$ext key", async ({ contentType, ext }) => {
      const result = await CloudStorageService.presignUpload({
        accountId: "test-account",
        contentType,
        contentLength: 1000
      });
      expect(result.isOk()).toBe(true);
      expect(result.isOk() && result.value.key.endsWith(`.${ext}`)).toBe(true);
    });

    it("allows a video just under the 50 MB cap", async () => {
      const result = await CloudStorageService.presignUpload({
        accountId: "test-account",
        contentType: "video/mp4",
        contentLength: 49 * 1024 * 1024
      });
      expect(result.isOk()).toBe(true);
    });

    it("round-trips an upload and delete against Minio", async () => {
      const accountId = `test-${Date.now()}`;
      const body = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

      const presign = await CloudStorageService.presignUpload({
        accountId,
        contentType: "image/png",
        contentLength: body.byteLength
      });
      expect(presign.isOk()).toBe(true);
      if (!presign.isOk()) return;

      const put = await fetch(presign.value.url, {
        method: "PUT",
        headers: presign.value.headers,
        body
      });
      expect(put.ok).toBe(true);

      const head = await fetch(CloudStorageService.publicUrlFor(presign.value.key), { method: "HEAD" });
      expect(head.ok).toBe(true);

      const del = await CloudStorageService.delete(presign.value.key);
      expect(del.isOk()).toBe(true);
    });

    it("treats deleting a missing key as success", async () => {
      const result = await CloudStorageService.delete(`account/missing/${Date.now()}.png`);
      expect(result.isOk()).toBe(true);
    });
  });
});
