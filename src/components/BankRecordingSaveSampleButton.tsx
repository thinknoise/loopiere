import React, { useState } from "react";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET, REGION } from "../utils/awsConfig";
import "../style/bankSample.css";

type Props = {
  blob: Blob;
  fileName: string;
  onSave: (sample: {
    name: string;
    s3Key: string;
    s3Url: string;
    createdAt: number;
  }) => void;
};

export default function SaveSampleButton({ blob, fileName, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setSaving(true);
    setError(null);

    const key = `uploads/${Date.now()}-${fileName}`;

    console.log("blob type:", blob.type);
    try {
      const buffer = await blob.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: blob.type,
      });

      await s3.send(command);

      const sample = {
        name: fileName,
        s3Key: key,
        s3Url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`,
        createdAt: Date.now(),
      };

      onSave(sample);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Upload failed. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="save-upload-container">
      <button
        className="save-upload-button"
        onClick={handleClick}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save to Bank"}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
