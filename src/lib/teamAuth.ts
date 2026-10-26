"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/data";
import { can, type AppRole } from "@/lib/permissions";
import { homeFor } from "@/lib/appNav";
import type { ActionResult } from "@/lib/actions";
import { DEVICE_COOKIE, deviceHash, hashToken } from "@/lib/teamDevice";

const ROLES: AppRole[] = ["owner", "admin", "produksi", "manager", "crew"];

export interface PinResult {
  error?: string;
  locked?: boolean;
}

/** Checks the PIN on a registered device, then opens a normal Supabase session for that person. */
export async function pinLogin(userId: string, pin: string, next: string): Promise<PinResult> {
  const admin = adminClient();
  const hash = await deviceHash();
  if (!admin || !hash) return { error: "Perangkat ini belum terdaftar. Masuk dengan email." };
  if (!/^[0-9]{4}$/.test(pin)) return { error: "PIN salah, coba lagi." };

  const { data: verdict, error } = await admin.rpc("pin_check", { p_device_hash: hash, p_user: userId, p_pin: pin });
  if (error) return { error: "Gagal memeriksa PIN. Coba lagi." };
  if (verdict === "terkunci") return { error: "Terlalu banyak PIN salah. Coba lagi dalam 15 menit.", locked: true };
  if (verdict === "perangkat") return { error: "Perangkat ini sudah tidak terdaftar. Masuk dengan email." };
  if (verdict !== "ok") return { error: "PIN salah, coba lagi." };

  // Open a session without a password: a one-time magic-link token, verified right here on the server.
  const { data: user } = await admin.auth.admin.getUserById(userId);
  const email = user?.user?.email;
  if (!email) return { error: "Akun ini belum lengkap. Hubungi Alto." };
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link?.properties?.hashed_token) return { error: "Gagal masuk. Coba lagi." };
  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (otpError) return { error: "Gagal masuk. Coba lagi." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  redirect(next.startsWith("/app") ? next : homeFor((profile?.role as AppRole | null) ?? null));
}

// ---- Akun tim (Alto only) ------------------------------------------------------

async function requireOwner() {
  const user = await getCurrentUser();
  if (!can(user.role, "team.manage")) throw new Error("Hanya Alto yang bisa mengatur akun tim.");
  return user;
}

/** Registers the browser this is called from as a PIN-login device. */
export async function registerDevice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return { error: "Beri nama perangkat, mis. Tablet kafe." };
  const token = randomBytes(32).toString("hex");
  const supabase = await createClient();
  const { error } = await supabase.from("devices").insert({ name, token_hash: hashToken(token), created_by: user.id });
  if (error) return { error: "Gagal mendaftarkan perangkat." };
  (await cookies()).set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  revalidatePath("/app/lainnya/akun");
  return {};
}

export async function revokeDevice(id: string): Promise<ActionResult> {
  await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase.from("devices").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: "Gagal mencabut perangkat." };
  revalidatePath("/app/lainnya/akun");
  return {};
}

function readPerson(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 60);
  const title = String(formData.get("title") ?? "").trim().slice(0, 40);
  const roleRaw = String(formData.get("role") ?? "");
  const role = ROLES.includes(roleRaw as AppRole) ? (roleRaw as AppRole) : null;
  const pin = String(formData.get("pin") ?? "").trim();
  return { fullName, title, role, pin };
}

/** Saves name, title, role and active flag; sets a new PIN when one is typed. */
export async function savePerson(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const { fullName, title, role, pin } = readPerson(formData);
  const isActive = formData.get("is_active") === "on";
  // Only an Owner-role (admin) person can be the backup decider (decide_approval checks the same).
  const approvalBackup = formData.get("approval_backup") === "on" && role === "admin";
  if (!fullName) return { error: "Nama wajib diisi." };
  if (pin && !/^[0-9]{4}$/.test(pin)) return { error: "PIN harus 4 angka." };
  if (id === me.id && (role !== "owner" || !isActive)) return { error: "Akun Alto sendiri tetap Owner dan aktif." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: fullName, title, role, is_active: isActive, approval_backup: approvalBackup }).eq("id", id);
  if (error) return { error: "Gagal menyimpan." };
  if (pin) {
    const { error: pinError } = await supabase.rpc("set_pin", { p_user: id, p_pin: pin });
    if (pinError) return { error: "Data tersimpan, tapi PIN gagal diatur." };
  }
  revalidatePath("/app/lainnya/akun");
  return {};
}

/** Adds a person who logs in only with a PIN (no real email needed). */
export async function addPerson(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireOwner();
  const { fullName, title, role, pin } = readPerson(formData);
  if (!fullName) return { error: "Nama wajib diisi." };
  if (!role) return { error: "Pilih peran." };
  if (!/^[0-9]{4}$/.test(pin)) return { error: "PIN harus 4 angka." };
  const admin = adminClient();
  if (!admin) return { error: "SUPABASE_SECRET_KEY belum diisi, jadi akun baru belum bisa dibuat dari aplikasi." };

  // Supabase Auth needs an email; PIN-only people get an address on the reserved .invalid domain (never mailed).
  const email = `tim-${randomBytes(6).toString("hex")}@mami-i.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error || !data.user) return { error: "Gagal membuat akun." };

  const supabase = await createClient();
  const { data: lastRow } = await supabase.from("profiles").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, title, role, sort_order: (lastRow?.sort_order ?? 0) + 1 })
    .eq("id", data.user.id);
  if (profileError) return { error: "Akun dibuat, tapi peran gagal disimpan." };
  const { error: pinError } = await supabase.rpc("set_pin", { p_user: data.user.id, p_pin: pin });
  if (pinError) return { error: "Akun dibuat, tapi PIN gagal diatur." };
  revalidatePath("/app/lainnya/akun");
  return {};
}
