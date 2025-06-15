import React, { useState } from "react";
import "../style/bankSample.css";

type Props = {
  onSave: () => Promise<boolean>; // updated
};

export default function SaveSampleButton({ onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setSaving(true);
    setError(null);
    try {
      const success = await onSave(); // updated
      if (!success) {
        setError("Upload failed. Check console.");
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error.");
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
