"use client";

import { createClient } from "./supabase/client";

/** Shrinks a phone photo to at most `maxSide` px and re-encodes as JPEG. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal memproses foto"))), "image/jpeg", quality),
  );
}

/** Compresses and uploads a photo; returns the storage path. */
export async function uploadPhoto(bucket: "product-photos" | "payment-proofs", folder: string, file: File): Promise<string> {
  const blob = await compressImage(file);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient().storage.from(bucket).upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw new Error(`Upload foto gagal: ${error.message}`);
  return path;
}
