import React, { useState } from "react";
import "../style/bankSample.css";

type Props = {
  blob: Blob;
  fileName: string;
  onSave: () => void;
};

export default function SaveSampleButton({ blob, fileName, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave();
    } catch (err) {
      console.error(err);
      setError("Upload failed. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`save-upload-button ${error ? "error-message" : ""}`}
      onClick={handleClick}
    >
      {saving && !error ? "Saving..." : !error ? "Save to Bank" : error}
    </div>
  );
}
