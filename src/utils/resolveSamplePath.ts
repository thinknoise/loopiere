const AWS_BASE_URL = "https://loopiere-recording.s3.amazonaws.com/banks";

export function resolveSamplePath(sampleKey: string): string {
  if (!sampleKey) return "";

  if (sampleKey.startsWith("blob:") || /^https?:\/\//.test(sampleKey)) {
    return sampleKey;
  }

  return `${AWS_BASE_URL}/${sampleKey.replace(/^\/+/, "")}`;
}
