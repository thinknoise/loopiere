// fetchAudioData.js
const BASE = process.env.PUBLIC_URL || "";

export async function fetchAudioData(bank) {
  // pick the JSON filename (bank might be e.g. "onehits.json")
  const filename = bank || "samples.json";

  // build the correct URL under your PUBLIC_URL
  // — if you have assetUrl exported from audioManager you can do:
  // const url = assetUrl(filename);
  // otherwise:
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
    return await response.json();
  } catch (error) {
    console.error("fetchAudioData: failed to load JSON", url, error);
    return null;
  }
}
