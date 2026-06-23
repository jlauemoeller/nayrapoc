import { Result, ok, err } from "neverthrow";
import { S3Client, DeleteObjectCommand, PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { appConfig } from "@/lib/config";
import { generateId } from "@/lib/db/uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type PresignedUpload = {
  key: string;
  url: string;
  headers: Record<string, string>;
  expiresAt: Date;
  publicUrl: string;
};

const PRESIGN_TTL_SECONDS = 60;

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  // Some browsers report .wav files as audio/x-wav.
  "audio/x-wav": "wav",
  "audio/ogg": "ogg"
};

// Per-category upload caps, keyed by the content-type prefix (e.g. "image/png" -> "image").
const MAX_BYTES_BY_CATEGORY: Record<string, number> = {
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 25 * 1024 * 1024
};

function maxBytesFor(contentType: string): number {
  const category = contentType.split("/")[0];
  // Fall back to the image cap as a conservative floor for anything uncategorized.
  return MAX_BYTES_BY_CATEGORY[category] ?? MAX_BYTES_BY_CATEGORY.image;
}

let cachedClient: S3Client | undefined;

function getClient(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: appConfig.objectStorage.endpoint,
      region: appConfig.objectStorage.region,
      forcePathStyle: appConfig.objectStorage.forcePathStyle,
      credentials: {
        accessKeyId: appConfig.objectStorage.accessKeyId,
        secretAccessKey: appConfig.objectStorage.secretAccessKey
      },
      // Without this, the SDK signs an x-amz-checksum-crc32 placeholder into
      // the presigned URL, and the browser PUT fails signature validation.
      requestChecksumCalculation: "WHEN_REQUIRED"
    });
  }
  return cachedClient;
}

export class CloudStorageService {
  static async presignUpload(input: {
    accountId: string;
    contentType: string;
    contentLength: number;
  }): Promise<Result<PresignedUpload, string>> {
    const ext = ALLOWED_CONTENT_TYPES[input.contentType];

    if (!ext) return err(`${input.contentType} is not an allowed file type`);

    const maxBytes = maxBytesFor(input.contentType);
    if (input.contentLength <= 0 || input.contentLength > maxBytes) {
      return err(`${ext} files must be less than ${maxBytes} bytes`);
    }

    const key = `account/${input.accountId}/${generateId()}.${ext}`;

    try {
      const command = new PutObjectCommand({
        Bucket: appConfig.objectStorage.bucket,
        Key: key,
        ContentType: input.contentType,
        ContentLength: input.contentLength
      });
      const url = await getSignedUrl(getClient(), command, { expiresIn: PRESIGN_TTL_SECONDS });

      return ok({
        key,
        url,
        headers: {
          "Content-Type": input.contentType
        },
        expiresAt: new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000),
        publicUrl: CloudStorageService.publicUrlFor(key)
      });
    } catch (error) {
      console.error("CloudStorageService.presignUpload failed", error);
      return err("Could not store file");
    }
  }

  static async uploadFromUrl(input: {
    accountId: string;
    url: string;
  }): Promise<Result<{ key: string; publicUrl: string }, string>> {
    let response: Response;
    try {
      response = await fetch(input.url, {
        signal: AbortSignal.timeout(5000),
        redirect: "follow"
      });
    } catch (error) {
      console.error("CloudStorageService.uploadFromUrl fetch failed", { url: input.url, error });
      return err("Could not upload file");
    }

    if (!response.ok || !response.body) return err("Could not download file");

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const ext = ALLOWED_CONTENT_TYPES[contentType];
    if (!ext) return err(`${contentType} is not an allowed content type`);

    const maxBytes = maxBytesFor(contentType);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      return err(`${ext} files must be less than ${maxBytes} bytes`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0) return err("Could not store file");
    if (buffer.byteLength > maxBytes) return err("File too large");

    const key = `account/${input.accountId}/${generateId()}.${ext}`;
    try {
      await getClient().send(
        new PutObjectCommand({
          Bucket: appConfig.objectStorage.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ContentLength: buffer.byteLength
        })
      );
      return ok({ key, publicUrl: CloudStorageService.publicUrlFor(key) });
    } catch (error) {
      console.error("CloudStorageService.uploadFromUrl put failed", { url: input.url, error });
      return err("Could not store file");
    }
  }

  static async delete(key: string): Promise<Result<true, string>> {
    try {
      await getClient().send(
        new DeleteObjectCommand({
          Bucket: appConfig.objectStorage.bucket,
          Key: key
        })
      );
      return ok(true);
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === "NoSuchKey") {
        return ok(true);
      }
      console.error("CloudStorageService.delete failed", { key, error });
      return err("Could not delete file");
    }
  }

  static keyBelongsToAccount(key: string, accountId: string): boolean {
    return key.startsWith(`account/${accountId}/`);
  }

  static publicUrlFor(key: string): string {
    const base = appConfig.objectStorage.publicUrl.replace(/\/$/, "");
    const bucket = appConfig.objectStorage.bucket;
    return `${base}/${bucket}/${key}`;
  }
}
