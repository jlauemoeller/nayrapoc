import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { appConfig } from "@lib/config";

// Resets the demo object store: empties the bucket, then re-uploads any committed
// seed media so the curated db-dump.json's image/video blocks resolve. Run as part
// of `pnpm db:reset` (initial seed + hourly Ofelia cron).
//
// Fixtures live under scripts/fixtures/storage/ and their path *relative to that
// dir* is the S3 key — e.g. scripts/fixtures/storage/account/<id>/<uuid>.png maps
// to key "account/<id>/<uuid>.png", matching CloudStorageService's namespacing.
// If the dir is absent the script just empties the bucket.

const FIXTURE_ROOT = join(process.cwd(), "scripts", "fixtures", "storage");

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg"
};

function client(): S3Client {
  return new S3Client({
    endpoint: appConfig.objectStorage.endpoint,
    region: appConfig.objectStorage.region,
    forcePathStyle: appConfig.objectStorage.forcePathStyle,
    credentials: {
      accessKeyId: appConfig.objectStorage.accessKeyId,
      secretAccessKey: appConfig.objectStorage.secretAccessKey
    }
  });
}

async function emptyBucket(s3: S3Client, bucket: string): Promise<number> {
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const listed = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken })
    );
    const objects = listed.Contents ?? [];
    if (objects.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects.map((o) => ({ Key: o.Key! })), Quiet: true }
        })
      );
      deleted += objects.length;
    }
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  return deleted;
}

function fixtureFiles(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      out.push(...fixtureFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

async function uploadFixtures(s3: S3Client, bucket: string): Promise<number> {
  if (!existsSync(FIXTURE_ROOT)) return 0;

  const files = fixtureFiles(FIXTURE_ROOT);
  for (const file of files) {
    // Use POSIX-style "/" separators in the key regardless of host OS.
    const key = relative(FIXTURE_ROOT, file).split(sep).join("/");
    const contentType = CONTENT_TYPE_BY_EXT[extname(file).toLowerCase()] ?? "application/octet-stream";
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: readFileSync(file),
        ContentType: contentType
      })
    );
  }
  return files.length;
}

async function main() {
  const bucket = appConfig.objectStorage.bucket;
  const s3 = client();

  const deleted = await emptyBucket(s3, bucket);
  const uploaded = await uploadFixtures(s3, bucket);

  s3.destroy();
  console.log(`Storage reset: deleted ${deleted} object(s), uploaded ${uploaded} fixture(s) to "${bucket}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
