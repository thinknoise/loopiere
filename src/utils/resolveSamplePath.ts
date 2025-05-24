export function resolveSamplePath(sampleString: string): string {
  if (!sampleString) return "";

  const isBlobUrl = sampleString.startsWith("blob:");
  const isHttpUrl = /^https?:\/\//.test(sampleString);

  if (isBlobUrl || isHttpUrl) {
    return sampleString; // leave full or blob URLs untouched
  }

  // assume relative path, normalize and prepend
  return `/loopiere/samples/${sampleString.replace(/^\/+/, "")}`;
}
