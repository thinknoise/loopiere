import React, { useRef } from "react";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "../utils/awsConfig";
import "../style/sampleUploaded.css";

export default function SampleUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return alert("Please select a file first.");

    const key = `uploads/test-${Date.now()}-${file.name}`;

    try {
      // Convert File to ArrayBuffer
      const buffer = await file.arrayBuffer();

      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: new Uint8Array(buffer), // <- this avoids stream logic
        ContentType: file.type,
      });

      await s3.send(command);
      alert(`✅ Uploaded to S3: ${key}`);
    } catch (err) {
      console.error("❌ Upload failed", err);
      alert("Upload failed. Check the console for details.");
    }
  };

  return (
    <div className="sample-uploader">
      <input type="file" ref={fileInputRef} />
      <button className="upload-button" onClick={handleUpload}>
        Upload to S3
      </button>
    </div>
  );
}
