import { describe, it, expect, beforeEach, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-s3", async () => {
  const actual = await vi.importActual<typeof import("@aws-sdk/client-s3")>("@aws-sdk/client-s3");
  class FakeS3Client {
    send = sendMock;
  }
  return { ...actual, S3Client: FakeS3Client };
});

import { CloudStorageService } from "@lib/services/cloudStorageService";

function imageResponse(
  // Uint8Array<ArrayBuffer> (not the default Uint8Array<ArrayBufferLike>) because BodyInit
  // rejects views that could be backed by a SharedArrayBuffer.
  opts: { contentType?: string; contentLength?: number; body?: Uint8Array<ArrayBuffer>; status?: number } = {}
) {
  const body = opts.body ?? new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const headers: Record<string, string> = { "content-type": opts.contentType ?? "image/png" };
  if (opts.contentLength !== undefined) headers["content-length"] = String(opts.contentLength);
  return new Response(body, { status: opts.status ?? 200, headers });
}

beforeEach(() => {
  sendMock.mockReset();
});

describe("CloudStorageService.uploadFromUrl", () => {
  it("uploads a fetched image and returns the key + public url", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(imageResponse());
    sendMock.mockResolvedValueOnce({});

    const result = await CloudStorageService.uploadFromUrl({ accountId: "acc-1", url: "https://other/img.png" });

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    expect(result.value.key.startsWith("account/acc-1/")).toBe(true);
    expect(result.value.key.endsWith(".png")).toBe(true);
    expect(result.value.publicUrl).toContain(result.value.key);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported content types", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(imageResponse({ contentType: "application/pdf" }));
    const result = await CloudStorageService.uploadFromUrl({ accountId: "acc-1", url: "https://other/doc.pdf" });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toMatch(/not an allowed content type/);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects oversized declared content-length up front", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(imageResponse({ contentLength: 6 * 1024 * 1024 }));
    const result = await CloudStorageService.uploadFromUrl({ accountId: "acc-1", url: "https://other/img.png" });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toMatch(/must be less than/);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns an error when the source fetch throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("network down"));
    const result = await CloudStorageService.uploadFromUrl({ accountId: "acc-1", url: "https://other/img.png" });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toMatch(/Could not upload/);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns an error when the source returns a non-2xx response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(imageResponse({ status: 404 }));
    const result = await CloudStorageService.uploadFromUrl({ accountId: "acc-1", url: "https://other/img.png" });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toMatch(/Could not download/);
  });

  it("returns an error when the S3 put fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(imageResponse());
    sendMock.mockRejectedValueOnce(new Error("S3 down"));
    const result = await CloudStorageService.uploadFromUrl({ accountId: "acc-1", url: "https://other/img.png" });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error).toMatch(/Could not store/);
  });
});
