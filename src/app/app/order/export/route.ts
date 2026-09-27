import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { toCsv } from "@/lib/csv";
import { parseOrderFilter } from "@/lib/orderParams";
import {
  FULFILL_LABEL, filterOrders, orderProfit, PAYMENT_STATUS_LABEL, paymentStatus, productCosts, remainingOf, STATUS_LABEL,
} from "@/lib/preorder";

// CSV export of the order list with the same filters as the page.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user.role) return new Response("Forbidden", { status: 403 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const showProfit = can(user.role, "profit.view");
  const [data, costing] = await Promise.all([loadPreorderData(), showProfit ? loadCostingData() : null]);
  const current = costing ? productCosts(data.products, costing) : new Map<string, number | null>();
  const rows = filterOrders(data.orders, data.customers, parseOrderFilter(params));
  const customers = new Map(data.customers.map((c) => [c.id, c]));
  const campaigns = new Map(data.campaigns.map((c) => [c.id, c.name]));
  const products = new Map(data.products.map((p) => [p.id, p.name]));

  const csv = toCsv([
    [
      "No. order", "Tanggal order", "Tanggal ambil/kirim", "Metode", "Status", "Campaign", "Pelanggan", "WhatsApp",
      "Alamat kirim", "Item", "Subtotal", "Ongkir", "Diskon", "Total", "DP", "Terbayar", "Sisa", "Status bayar", "Catatan",
      ...(showProfit ? ["HPP", "Laba kotor"] : []),
    ],
    ...rows.map((o) => {
      const c = customers.get(o.customerId);
      const profit = showProfit ? orderProfit(o, current) : null;
      return [
        o.orderNo,
        o.createdAt.slice(0, 10),
        o.fulfillDate,
        FULFILL_LABEL[o.fulfillMethod],
        STATUS_LABEL[o.status],
        o.campaignId ? campaigns.get(o.campaignId) ?? "" : "",
        c?.name ?? "",
        c?.whatsapp ?? "",
        o.deliveryAddress ?? "",
        o.items.map((i) => `${i.qty}x ${products.get(i.productId) ?? "?"}`).join("; "),
        o.subtotal, o.shippingFee, o.discount, o.total, o.dpAmount, o.amountPaid,
        remainingOf(o.total, o.amountPaid),
        PAYMENT_STATUS_LABEL[paymentStatus(o.total, o.dpAmount, o.amountPaid)],
        o.notes ?? "",
        ...(profit ? [Math.round(profit.hpp), Math.round(profit.profit)] : []),
      ];
    }),
  ]);

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="order-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
