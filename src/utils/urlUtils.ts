// src/utils/urlUtils.ts

/**
 * Represents a single sequence parameter for URL encoding.
 */
export interface SequenceParam {
  /** Unique numeric ID of the track sample */
  trackSampleId: number;
  /** Fractional position across the track (0–1) */
  xPos: number;
}

/**
 * Append sequence parameters and tempo to the browser URL without reloading.
 * @param sequence - Array of sequence items (trackSampleId and xPos)
 * @param tempo - Beats per minute (unused currently but reserved for future)
 */
export function addParamsToUrl(sequence: SequenceParam[], tempo: number): void {
  const currentUrl = new URL(
    `${window.location.origin}${window.location.pathname}`
  );

  sequence.forEach((sample, index) => {
    const sampleAndPosition = [
      sample.trackSampleId,
      Math.round(sample.xPos * 100) / 100,
    ].join(",");
    currentUrl.searchParams.set(`s-${index}`, sampleAndPosition);
  });

  // Optionally add tempo as a URL parameter
  currentUrl.searchParams.set("tempo", tempo.toString());

  window.history.pushState({}, "", currentUrl.toString());
}

/**
 * Parse URL search parameters into an array of key/value pairs.
 * @returns Array of objects with `key` and `value` strings.
 */
export function getParamsAsArray(): Array<{ key: string; value: string }> {
  const params = new URLSearchParams(window.location.search);
  const paramArray: Array<{ key: string; value: string }> = [];

  params.forEach((value, key) => {
    paramArray.push({ key, value });
  });

  return paramArray;
}
