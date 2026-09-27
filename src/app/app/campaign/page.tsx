import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { formatDateId, todayJakarta } from "@/lib/preorder";
import { formatRupiah } from "@/lib/format";
import { DummyTag, EmptyState, PageHeader } from "@/components/ui";
import { campaignState } from "./status";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignsPage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadPreorderData()]);
  const today = todayJakarta();
  return (
    <>
      <PageHeader
        title="Campaign"
        back="/app/lainnya"
        action={can(user.role, "catalog.edit") ? <Link href="/app/campaign/baru" className="btn-primary px-4">+ Campaign</Link> : null}
      />
      {data.campaigns.length === 0 ? <EmptyState>Belum ada campaign.</EmptyState> : (
        <ul className="flex flex-col gap-2">
          {data.campaigns.map((c) => {
            const st = campaignState(c, today);
            const orders = data.orders.filter((o) => o.campaignId === c.id && o.status !== "batal");
            return (
              <li key={c.id}>
                <Link href={`/app/campaign/${c.id}`} className="card block">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">{c.name}<DummyTag show={c.isDummy} /></p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.className}`}>{st.label}</span>
                  </div>
                  <p className="text-sm text-muted">
                    Preorder {formatDateId(c.preorderOpen, false)} – {formatDateId(c.preorderClose, false)}
                  </p>
                  {(c.fulfillStart || c.fulfillEnd) && (
                    <p className="text-sm text-muted">
                      Ambil/kirim {c.fulfillStart ? formatDateId(c.fulfillStart, false) : "…"} – {c.fulfillEnd ? formatDateId(c.fulfillEnd, false) : "…"}
                    </p>
                  )}
                  <p className="mt-1 text-sm"><b>{orders.length} order</b> · {formatRupiah(orders.reduce((s, o) => s + o.total, 0))} · {c.products.length} produk</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
