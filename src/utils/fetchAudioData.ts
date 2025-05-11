// src/utils/fetchAudioData.ts

const BASE: string = process.env.PUBLIC_URL || "";

export async function fetchAudioData<T = any>(
  bank?: string
): Promise<T[] | null> {
  // pick the JSON filename (bank might be e.g. "onehits.json")
  const filename = bank || "samples.json";

  // build the correct URL under your PUBLIC_URL
  const url = `${BASE}/${filename}`.replace(/\/{2,}/g, "/");
  console.log("Fetching audio data from", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Error fetching data: ${response.status} ${response.statusText}`
      );
    }
    // parse as JSON and assert it's an array of T
    const data = (await response.json()) as T[];
    return data;
  } catch (error) {
    console.error("fetchAudioData: failed to load JSON", url, error);
    return null;
  }
}
