"use client";

/** Real photo capture: FileReader + canvas resize, stored as a data URI. */
export async function compressImage(file: File, maxEdge = 900, quality = 0.7): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("Could not read the file"));
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not open the image"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export const MAX_UPLOAD_MB = 8;

export function checkFile(file: File, accept: "image" | "audio" | "doc"): string | null {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `File is larger than ${MAX_UPLOAD_MB} MB.`;
  if (accept === "image" && !file.type.startsWith("image/")) return "Choose a photo.";
  if (accept === "audio" && !file.type.startsWith("audio/")) return "Choose an audio recording.";
  return null;
}

/** Real coordinates, blurred to ~1 km before anything is stored. */
export function getFuzzedLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: Math.round(p.coords.latitude * 100) / 100, lng: Math.round(p.coords.longitude * 100) / 100 }),
      () => resolve(null),
      { timeout: 6000 },
    );
  });
}
