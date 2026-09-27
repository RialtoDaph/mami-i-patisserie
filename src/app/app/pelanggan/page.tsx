import Link from "next/link";
import type { Metadata } from "next";
import { loadPreorderData } from "@/lib/preorderData";
import { formatWhatsapp, orderCountByCustomer } from "@/lib/preorder";
import { formatRupiah } from "@/lib/format";
import { DummyTag, EmptyState, PageHeader } from "@/components/ui";
import { RepeatBadge } from "@/components/preorder";

export const metadata: Metadata = { title: "Pelanggan" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; ulang?: string }> }) {
  const { q, ulang } = await searchParams;
  const data = await loadPreorderData();
  const counts = orderCountByCustomer(data.orders);
  const spend = new Map<string, number>();
  for (const o of data.orders) if (o.status !== "batal") spend.set(o.customerId, (spend.get(o.customerId) ?? 0) + o.total);
  const needle = q?.trim().toLowerCase();
  const digits = needle?.replace(/\D/g, "").replace(/^0/, "");
  const rows = data.customers
    .filter((c) => !needle || c.name.toLowerCase().includes(needle) || (digits && digits.length >= 3 && c.whatsapp.includes(digits)))
    .filter((c) => !ulang || (counts.get(c.id) ?? 0) >= 2)
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader title="Pelanggan" back="/app/lainnya" />
      <form className="mb-3 flex gap-2" action="/app/pelanggan">
        <input type="search" name="q" defaultValue={q ?? ""} placeholder="Cari nama atau no. WA" className="input" />
        <button className="btn-secondary px-4" type="submit">Cari</button>
      </form>
      <div className="mb-4 flex gap-2">
        <Link href="/app/pelanggan" className={!ulang ? "chip-on" : "chip-off"}>Semua</Link>
        <Link href="/app/pelanggan?ulang=1" className={ulang ? "chip-on" : "chip-off"}>Order ulang</Link>
      </div>
      {rows.length === 0 ? <EmptyState>Belum ada pelanggan.</EmptyState> : (
        <ul className="flex flex-col gap-2">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/app/pelanggan/${c.id}`} className="card flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <b>{c.name}</b>
                  <RepeatBadge count={counts.get(c.id) ?? 0} />
                  <DummyTag show={c.isDummy} />
                  <span className="block text-xs text-muted">{formatWhatsapp(c.whatsapp)}</span>
                </span>
                <span className="shrink-0 text-right text-sm">
                  <b>{counts.get(c.id) ?? 0} order</b>
                  <span className="block text-muted">{formatRupiah(spend.get(c.id) ?? 0)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
