"use client";

import { compressImage } from "@/lib/capture";

import type { Photo } from "./state";

/**
 * A phone photo ready to store. Re-drawing it on a canvas keeps the pixels and
 * drops the EXIF block — GPS position included — before anything is saved.
 */
export async function toPhoto(file: File, index: number): Promise<Photo> {
  const src = await compressImage(file, 900, 0.7);
  return {
    id: `PH-${Date.now().toString(36)}-${index}`,
    src,
    name: `Sawir ${index}`,
    file: file.name || "photo.jpg",
    kb: Math.round((src.length * 3) / 4 / 1024),
    at: new Date().toISOString(),
  };
}
