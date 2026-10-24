import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser, loadCostingData, type CurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadKitchen, loadPreorderData, type PreorderData } from "@/lib/preorderData";
import type { FullCostingData } from "@/lib/data";
import {
  addDays, campaignUsed, currentCampaign, dailyRevenue, dueOn, formatDateId, FULFILL_LABEL, lateDps, lowStock, monthRange,
  ordersBetween, productCosts, productionSchedule, profitStats, recipeNeeds, todayJakarta,
} from "@/lib/preorder";
import { pricePerBaseUnit } from "@/lib/costing";
import { formatNumber, formatPercent, formatRupiah } from "@/lib/format";
import { EmptyNote, Kpi, ListRow, Panel, PanelTitle, SectionLabel } from "@/components/app/ui";
import { LineChart } from "@/components/app/LineChart";
import { Icon, type IconName } from "@/components/brand";
import { StatusBadge } from "@/components/preorder";
import { MadeToggle } from "./_home/MadeToggle";
import { MarkReady } from "./_home/MarkReady";

export const metadata: Metadata = { title: "Beranda" };

/** "Rp 128,3 jt" for the KPI cards (prototype). */
function compactRp(n: number): string {
  if (Math.abs(n) >= 1e9) return `Rp ${formatNumber(n / 1e9, 2)} M`;
  if (Math.abs(n) >= 1e7) return `Rp ${formatNumber(n / 1e6, 1)} jt`;
  return formatRupiah(n);
}

export default async function HomePage() {
  const [user, pre, costing] = await Promise.all([getCurrentUser(), loadPreorderData(), loadCostingData()]);
  return can(user.role, "dashboard.view") ? <OwnerHome user={user} pre={pre} costing={costing} /> : <KitchenHome pre={pre} costing={costing} />;
}

// ---- Owners (Alto, Nana, Mami) -------------------------------------------------

async function OwnerHome({ user, pre, costing }: { user: CurrentUser; pre: PreorderData; costing: FullCostingData }) {
  const today = todayJakarta();
  const month = monthRange(today);
  const kitchen = await loadKitchen(month.from, today);
  const costs = productCosts(pre.products, costing);
  const monthOrders = ordersBetween(pre.orders, month.from, month.to);
  const revenue = monthOrders.reduce((s, o) => s + o.total, 0);
  const profit = profitStats(monthOrders, pre.products, costs);
  const campaign = currentCampaign(pre.campaigns, today);
  const used = campaign ? campaignUsed(campaign, pre.orders) : 0;
  const series = dailyRevenue(pre.orders, today, 30);
  const late = lateDps(pre.orders, today);
  const low = lowStock(costing.ingredients);
  const todayPlan = productionSchedule(pre.orders, pre.products, costing.recipes, costing.bundles, today, 1)[0];
  const ingredient = new Map(costing.ingredients.map((i) => [i.id, i]));
  const wasteValue = kitchen.waste.reduce((s, w) => {
    if (w.productId) return s + (costs.get(w.productId) ?? 0) * w.qty;
    const i = ingredient.get(w.ingredientId!);
    return s + (i ? pricePerBaseUnit(i) * w.qty : 0);
  }, 0);
  const firstProofOrder = pre.pendingProofs[0]?.orderId;
  const webToday = pre.orders.filter((o) => o.channel === "web" && o.createdAt.slice(0, 10) >= addDays(today, -1) && o.status !== "batal");

  // Focus list: only what exists today. Targets, approvals and weekly reports join in later stages.
  const items: { icon: IconName; title: string; sub: string; href: string }[] = [];
  if (pre.pendingProofs.length) {
    items.push({
      icon: "payments",
      title: `${pre.pendingProofs.length} bukti bayar menunggu dicek`,
      sub: `Total ${formatRupiah(pre.pendingProofs.reduce((s, p) => s + p.amount, 0))} · cocokkan dengan mutasi/QRIS lalu tekan "Bukti cocok".`,
      href: firstProofOrder ? `/app/order/${firstProofOrder}` : "/app/order",
    });
  }
  if (webToday.length) {
    items.push({ icon: "language", title: `${webToday.length} order web baru`, sub: "Masuk 2 hari terakhir dari website.", href: "/app/order" });
  }
  if (todayPlan.products.length) {
    items.push({
      icon: "skillet",
      title: `Produksi hari ini: ${todayPlan.products.reduce((s, p) => s + p.qty, 0)} item dari ${todayPlan.orderCount} order`,
      sub: todayPlan.products.slice(0, 3).map((p) => `${p.qty}× ${p.name}`).join(" · "),
      href: "/app/produksi?hari=1",
    });
  }
  if (low.length) {
    const under = low.filter((l) => l.state === "kurang");
    items.push({
      icon: "inventory_2",
      title: under.length ? `${under.length} bahan di bawah minimum` : `${low.length} bahan belum dihitung`,
      sub: low.slice(0, 3).map((l) => l.name).join(" · "),
      href: "/app/produksi/stok",
    });
  }
  if (wasteValue > 0) {
    items.push({ icon: "delete_sweep", title: `Waste bulan ini ± ${formatRupiah(wasteValue)}`, sub: `${kitchen.waste.length} catatan sejak ${formatDateId(month.from, false)}.`, href: "/app/produksi/waste" });
  }

  const focusTitle = user.role === "owner" ? "Untuk keputusanmu" : `Fokus ${user.fullName || "kamu"}`;
  const clock = (tz: string) => {
    const d = new Date();
    return {
      time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: tz }).replace(".", ":"),
      day: d.toLocaleDateString("id-ID", { weekday: "long", timeZone: tz }),
    };
  };

  return (
    <div className="mx-auto flex max-w-[1090px] flex-col gap-3">
      <div className="grid gap-3 nav:grid-cols-3">
        <Kpi label="Omzet bulan ini" value={compactRp(revenue)} note={`Pre-order ${monthOrders.length} order · omzet kafe menyusul (laporan Majoo)`} />
        <Kpi
          label="Laba kotor bulan ini"
          value={compactRp(profit.profit)}
          tone="olive"
          progress={profit.marginPct}
          note={`${formatPercent(profit.marginPct, 0)} margin · sebelum gaji & sewa`}
        />
        {campaign ? (
          <Kpi
            label={`Pace ${campaign.name}`}
            value={`${used} / ${campaign.quota ?? "–"} box`}
            tone="espresso"
            progress={campaign.quota ? (used / campaign.quota) * 100 : null}
            note={`${campaign.preorderOpen > today ? "Buka" : "Dibuka"} ${formatDateId(campaign.preorderOpen, false)} · tutup ${formatDateId(campaign.preorderClose, false)}`}
          />
        ) : (
          <Kpi label="Campaign" value="–" note="Tidak ada campaign yang buka." />
        )}
      </div>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <SectionLabel>{focusTitle}</SectionLabel>
          {user.role === "owner" && (
            <span className="flex gap-2">
              {[
                ["Indonesia", "Asia/Jakarta"],
                ["Jerman", "Europe/Berlin"],
              ].map(([label, tz]) => {
                const c = clock(tz);
                return (
                  <span key={tz} className="flex items-baseline gap-1.5 rounded-full border-[1.5px] border-brand-espresso/18 bg-white px-3 py-1">
                    <span className="text-[11px] font-bold tracking-wider text-brand-pistachio-deep uppercase">{label}</span>
                    <b className="font-display text-sm tabular-nums">{c.time}</b>
                    <span className="text-[11px] text-brand-muted capitalize">{c.day}</span>
                  </span>
                );
              })}
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <p className="border-t border-brand-espresso/10 px-4 py-5 text-[15px] text-brand-muted">Semua beres. Tidak ada yang perlu diputuskan sekarang.</p>
        ) : (
          <div className="border-t border-brand-espresso/10">
            {items.map((it, n) => (
              <ListRow key={it.title} first={n === 0} href={it.href} icon={it.icon} title={it.title} sub={it.sub} />
            ))}
          </div>
        )}
      </Panel>

      <div className="grid items-start gap-3 wide:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel>
          <PanelTitle
            aside={
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-[3px] w-4 rounded bg-brand-pistachio-deep" /> Pre-order
              </span>
            }
          >
            Omzet 30 hari
          </PanelTitle>
          <div className="mt-2">
            <LineChart days={series.map((s) => s.date)} series={[{ label: "Pre-order", values: series.map((s) => s.total), color: "#6b6047", fill: true }]} />
          </div>
          <p className="mt-2 text-xs text-brand-muted">
            Per tanggal ambil/kirim, total {compactRp(series.reduce((s, d) => s + d.total, 0))}. Garis kafe muncul setelah laporan Majoo masuk (Tahap 5f).
          </p>
        </Panel>

        <section className="flex flex-col gap-2">
          <SectionLabel className="px-1">Perlu perhatian</SectionLabel>
          {late.length === 0 ? (
            <EmptyNote>Tidak ada DP yang telat.</EmptyNote>
          ) : (
            <>
              {late.slice(0, 3).map(({ order, short }) => {
                const c = pre.customers.find((x) => x.id === order.customerId);
                return (
                  <Link
                    key={order.id}
                    href={`/app/order/${order.id}`}
                    className="flex min-h-16 items-center gap-3 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 px-3.5 py-2.5 hover:bg-brand-butter"
                  >
                    <span className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-wine-50 text-brand-wine">
                      <Icon name="payments" size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[15px]">DP telat · {c?.name ?? "?"}</b>
                      <span className="block text-[13px] text-brand-muted">
                        {order.orderNo} · ambil {formatDateId(order.fulfillDate, false).replace(/ \d{4}$/, "")} · kurang {formatRupiah(short)}
                      </span>
                    </span>
                    <Icon name="chevron_right" size={22} className="text-brand-muted" />
                  </Link>
                );
              })}
              {late.length > 3 && (
                <Link href="/app/order?status=menunggu_dp" className="px-1 text-[13px] font-bold text-brand-wine">
                  +{late.length - 3} lainnya
                </Link>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

// ---- Pastry chef (produksi) ------------------------------------------------------

async function KitchenHome({ pre, costing }: { pre: PreorderData; costing: FullCostingData }) {
  const today = todayJakarta();
  const tomorrow = addDays(today, 1);
  const [todayPlan, tomorrowPlan] = productionSchedule(pre.orders, pre.products, costing.recipes, costing.bundles, today, 2);
  const kitchen = await loadKitchen(today, today);
  const marks = kitchen.marks.get(today) ?? new Set<string>();
  const product = new Map(pre.products.map((p) => [p.id, p]));
  const doneCount = todayPlan.products.filter((p) => marks.has(p.productId)).length;
  const due = dueOn(pre.orders, today);
  const customer = new Map(pre.customers.map((c) => [c.id, c]));
  const low = lowStock(costing.ingredients).filter((l) => l.state === "kurang");

  const lineInfo = (productId: string, qty: number) => {
    const p = product.get(productId);
    if (!p) return { big: qty, sub: "" };
    if (p.bundleId) return { big: qty, sub: `${qty} box dirakit` };
    const batches = recipeNeeds(new Map([[productId, qty]]), pre.products, costing.recipes, costing.bundles)[0]?.batches;
    const adonan = batches ? `${formatNumber(batches, 1)} adonan` : "";
    return p.unitsPerProduct > 1
      ? { big: qty * p.unitsPerProduct, sub: [adonan, `${qty} pak isi ${p.unitsPerProduct}`].filter(Boolean).join(" · ") }
      : { big: qty, sub: adonan };
  };

  return (
    <div className="mx-auto flex max-w-[1090px] flex-col gap-3">
      <Panel>
        <PanelTitle aside={`${doneCount} dari ${todayPlan.products.length} selesai`}>Hari ini bikin apa</PanelTitle>
        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-brand-espresso/10">
          <span className="block h-full rounded-full bg-brand-olive" style={{ width: `${todayPlan.products.length ? (doneCount / todayPlan.products.length) * 100 : 0}%` }} />
        </span>
        {todayPlan.products.length === 0 ? (
          <p className="mt-3 text-[15px] text-brand-muted">Tidak ada order untuk hari ini.</p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {todayPlan.products.map((p) => {
              const info = lineInfo(p.productId, p.qty);
              return (
                <li key={p.productId} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-brand-espresso/10 py-3">
                  <span className="min-w-0 basis-full nav:basis-0 nav:flex-1">
                    <b className="block font-display text-[17px]">{p.name}</b>
                    {info.sub && <span className="block text-[13px] text-brand-muted">{info.sub}</span>}
                  </span>
                  <span className="ml-auto flex items-center gap-3">
                    <span className="flex flex-col items-end leading-none">
                      <b className="font-display text-[26px] tabular-nums">{info.big}</b>
                      <span className="text-[11px] text-brand-muted">pcs</span>
                    </span>
                    <MadeToggle date={today} productId={p.productId} done={marks.has(p.productId)} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <SectionLabel className="px-4 pt-3 pb-2">Diambil / dikirim hari ini</SectionLabel>
        {due.length === 0 ? (
          <p className="border-t border-brand-espresso/10 px-4 py-4 text-[15px] text-brand-muted">Tidak ada.</p>
        ) : (
          due.map((o) => (
            <div key={o.id} className="flex items-center gap-3 border-t border-brand-espresso/10 px-4 py-3">
              <Link href={`/app/order/${o.id}`} className="min-w-0 flex-1">
                <b className="block text-[15px]">{customer.get(o.customerId)?.name ?? "?"}</b>
                <span className="block text-[13px] text-brand-muted">
                  {FULFILL_LABEL[o.fulfillMethod]}
                  {o.pickupSlot && ` · jam ${o.pickupSlot}`} · {o.items.map((i) => `${i.qty}× ${product.get(i.productId)?.name ?? "?"}`).join(", ")}
                </span>
              </Link>
              {["baru", "menunggu_dp", "dp_diterima", "diproduksi"].includes(o.status) ? <MarkReady orderId={o.id} /> : <StatusBadge status={o.status} />}
            </div>
          ))
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          <SectionLabel>Besok · {formatDateId(tomorrow).replace(/ \d{4}$/, "")}</SectionLabel>
          <Link href="/app/produksi" className="flex items-center gap-1 text-[13px] font-bold text-brand-wine">
            Jadwal lengkap <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
        {tomorrowPlan.products.length === 0 ? (
          <p className="border-t border-brand-espresso/10 px-4 py-4 text-[15px] text-brand-muted">Belum ada order.</p>
        ) : (
          tomorrowPlan.products.map((p) => {
            const info = lineInfo(p.productId, p.qty);
            return (
              <div key={p.productId} className="flex items-center justify-between gap-3 border-t border-brand-espresso/10 px-4 py-2.5">
                <span>
                  <span className="block text-[15px]">{p.name}</span>
                  {info.sub && <span className="block text-[13px] text-brand-muted">{info.sub}</span>}
                </span>
                <b className="font-display text-xl tabular-nums">{info.big}</b>
              </div>
            );
          })
        )}
      </Panel>

      {low.length > 0 && (
        <Panel className="overflow-hidden">
          <ListRow
            first
            href="/app/produksi/stok"
            icon="inventory_2"
            title={`${low.length} bahan di bawah minimum`}
            sub={low.slice(0, 4).map((l) => l.name).join(" · ")}
          />
        </Panel>
      )}
    </div>
  );
}
