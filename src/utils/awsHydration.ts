import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { addSampleToAwsRegistry } from "./sampleRegistry";
import type { RecordingSample } from "../types/audio";
import { s3, BUCKET, REGION } from "./awsConfig";
import { loadAudio } from "./audioManager";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function hydrateAwsSamplesFromS3() {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: "uploads/",
  });

  const result = await s3.send(command);
  const items = result.Contents ?? [];

  for (const obj of items) {
    if (!obj.Key) continue;

    const s3Url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key }),
      { expiresIn: 300 }
    );
    const filename = obj.Key.split("/").pop() ?? "Untitled";
    const id = parseInt(obj.Key.match(/\d+/)?.[0] || Date.now().toString(), 10);

    try {
      const buffer = await loadAudio(s3Url);
      const sample: RecordingSample = {
        id,
        type: "recording",
        filename,
        title: filename,
        blob: new Blob(), // Optional: could omit or flag differently
        blobUrl: s3Url,
        recordedAt: new Date(), // Placeholder – could extract from metadata
        duration: buffer.duration,
        trimStart: 0,
        trimEnd: buffer.duration,
        buffer,
        s3Key: obj.Key,
        s3Url,
        name: filename,
      };

      await addSampleToAwsRegistry(sample);
    } catch (err) {
      console.warn(`❌ Failed to load or decode sample: ${filename}`, err);
    }
  }
}
