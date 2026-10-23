import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { can, type AppRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { deviceHash } from "@/lib/teamDevice";
import { formatDateId, todayJakarta } from "@/lib/preorder";
import { Icon } from "@/components/brand";
import { PageHeader } from "@/components/ui";
import { AddPersonForm, DeviceForm, PersonRow, RevokeDeviceButton, type PersonView } from "./AkunForms";

export const metadata: Metadata = { title: "Akun tim" };

export default async function TeamAccountsPage() {
  const user = await getCurrentUser();
  if (!can(user.role, "team.manage")) redirect("/app/lainnya");

  const supabase = await createClient();
  const [{ data: profiles }, { data: pins }, { data: devices }, myHash] = await Promise.all([
    supabase.from("profiles").select("id, full_name, title, role, is_active, sort_order").order("sort_order").order("full_name"),
    supabase.rpc("pin_status"),
    supabase.from("devices").select("id, name, token_hash, created_at, last_used_at, revoked_at").is("revoked_at", null).order("created_at"),
    deviceHash(),
  ]);
  const pinMap = new Map(((pins ?? []) as { user_id: string; locked: boolean }[]).map((p) => [p.user_id, p.locked]));
  const people: PersonView[] = (profiles ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    title: p.title,
    role: (p.role as AppRole | null) ?? null,
    isActive: p.is_active,
    hasPin: pinMap.has(p.id),
    locked: pinMap.get(p.id) ?? false,
    isMe: p.id === user.id,
  }));
  const thisDevice = (devices ?? []).find((d) => d.token_hash === myHash) ?? null;
  const pinReady = adminClient() !== null;

  return (
    <div className="flex max-w-[720px] flex-col gap-5">
      <PageHeader title="Akun tim" back="/app/lainnya" />

      {!pinReady && (
        <p className="rounded-md border-[1.5px] border-brand-wine/40 bg-brand-wine-50 p-3.5 text-sm">
          <b>Login PIN belum aktif.</b> Isi <code>SUPABASE_SECRET_KEY</code> (secret key dari Supabase → Project Settings → API Keys)
          di Vercel, lalu deploy ulang. Sampai itu, semua orang masuk dengan email dan password.
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 p-[18px]">
        <h2 className="font-display text-lg font-bold">Perangkat ini</h2>
        {thisDevice ? (
          <p className="flex items-start gap-2 text-[15px]">
            <Icon name="check_circle" size={20} className="mt-0.5 text-brand-olive" />
            <span>
              Terdaftar sebagai <b>{thisDevice.name}</b>. Di sini tim bisa masuk dengan nama + PIN.
            </span>
          </p>
        ) : (
          <>
            <p className="text-[15px] text-brand-muted">
              Daftarkan HP atau tablet yang dipakai tim (mis. tablet kafe, HP Mami). Hanya di perangkat terdaftar daftar nama dan
              keypad PIN muncul. Di perangkat lain tetap perlu email + password.
            </p>
            <DeviceForm />
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">Orang</h2>
        <div className="overflow-hidden rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50">
          {people.map((p, i) => (
            <PersonRow key={p.id} person={p} first={i === 0} />
          ))}
        </div>
        <AddPersonForm disabled={!pinReady} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">Perangkat terdaftar</h2>
        {(devices ?? []).length === 0 ? (
          <p className="text-[15px] text-brand-muted">Belum ada.</p>
        ) : (
          <div className="overflow-hidden rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50">
            {(devices ?? []).map((d, i) => (
              <div key={d.id} className={`flex min-h-16 items-center gap-3 px-4 ${i ? "border-t border-brand-espresso/10" : ""}`}>
                <Icon name="devices" size={22} className="text-brand-wine" />
                <span className="min-w-0 flex-1">
                  <b className="block text-[15px]">{d.name}{d.id === thisDevice?.id && " (perangkat ini)"}</b>
                  <span className="block text-[13px] text-brand-muted">
                    Didaftarkan {formatDateId(todayJakarta(new Date(d.created_at)), false)}
                    {d.last_used_at && ` · terakhir dipakai ${formatDateId(todayJakarta(new Date(d.last_used_at)), false)}`}
                  </span>
                </span>
                <RevokeDeviceButton id={d.id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
