import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { adminClient } from "@/lib/supabase/admin";

/** httpOnly cookie holding the secret of a device registered for the PIN login. */
export const DEVICE_COOKIE = "mami_device";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function deviceHash(): Promise<string | null> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  return token && /^[0-9a-f]{64}$/.test(token) ? hashToken(token) : null;
}

export interface PinPerson {
  id: string;
  name: string;
  title: string;
}

/** People offered on this device's login screen. Empty when the device is not registered. */
export async function devicePeople(): Promise<PinPerson[]> {
  const admin = adminClient();
  const hash = await deviceHash();
  if (!admin || !hash) return [];
  const { data, error } = await admin.rpc("pin_people", { p_device_hash: hash });
  if (error || !data) return [];
  return (data as { id: string; full_name: string; title: string }[]).map((p) => ({ id: p.id, name: p.full_name, title: p.title }));
}
