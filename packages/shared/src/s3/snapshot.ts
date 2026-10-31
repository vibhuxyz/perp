import { S3Client } from "bun";

export function getS3Client(): S3Client | null {
  const bucket =
    process.env.S3_BACKUP_BUCKET ||
    process.env.S3_SNAPSHOT_BUCKET ||
    process.env.S3_BUCKET_NAME;

  if (!bucket) {
    return null;
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "ap-south-1";
  const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL;

  return new S3Client({
    bucket,
    region,
    ...(accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : {}),
    ...(endpoint ? { endpoint } : {}),
  });
}

export async function uploadSnapshotToS3(
  snapshotJson: string,
  key = "backups/snapshots/snapshot-latest.json",
): Promise<boolean> {
  const s3 = getS3Client();
  if (!s3) {
    return false;
  }

  try {
    const file = s3.file(key);
    await file.write(snapshotJson, { type: "application/json" });

    // Optional timestamped archive
    if (process.env.S3_ARCHIVE_SNAPSHOTS === "true") {
      const archiveKey = `backups/snapshots/archive/snapshot-${Date.now()}.json`;
      await s3.file(archiveKey).write(snapshotJson, { type: "application/json" });
    }
    return true;
  } catch (err) {
    console.error("[S3] Failed to upload snapshot to S3:", err);
    return false;
  }
}

export async function downloadLatestSnapshotFromS3(
  key = "backups/snapshots/snapshot-latest.json",
): Promise<string | null> {
  const s3 = getS3Client();
  if (!s3) {
    return null;
  }

  try {
    const file = s3.file(key);
    const exists = await file.exists();
    if (!exists) {
      return null;
    }
    return await file.text();
  } catch (err) {
    console.error("[S3] Failed to download snapshot from S3:", err);
    return null;
  }
}
