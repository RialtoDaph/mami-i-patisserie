import { formatRupiah } from "../format";
import { formatDateId } from "./dates";
import { remainingOf } from "./payment";
import { FULFILL_LABEL } from "./status";
import type { Customer, Order, Settings } from "./types";

export function waLink(whatsapp: string, text: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
}

interface MessageContext {
  order: Order;
  customer: Pick<Customer, "name">;
  productName: (productId: string) => string;
  settings: Settings;
}

function paymentInfo(s: Settings): string[] {
  const lines: string[] = [];
  if (s.bankName && s.bankAccountNo) {
    lines.push(`Transfer ke ${s.bankName} ${s.bankAccountNo}${s.bankAccountName ? ` a.n. ${s.bankAccountName}` : ""}`);
  }
  if (s.qrisNote) lines.push(s.qrisNote);
  return lines;
}

function itemLines(ctx: MessageContext): string[] {
  return ctx.order.items.map((i) => `• ${i.qty}x ${ctx.productName(i.productId)} — ${formatRupiah(i.qty * i.unitPrice)}`);
}

function when(order: Order): string {
  return `${formatDateId(order.fulfillDate)} (${FULFILL_LABEL[order.fulfillMethod]})`;
}

export function confirmationMessage(ctx: MessageContext): string {
  const { order, customer, settings } = ctx;
  const lines = [
    `Halo ${customer.name}, terima kasih sudah order di ${settings.businessName} 🙏`,
    "",
    `Pesanan *${order.orderNo}*:`,
    ...itemLines(ctx),
    "",
    `Subtotal: ${formatRupiah(order.subtotal)}`,
  ];
  if (order.shippingFee > 0) lines.push(`Ongkir: ${formatRupiah(order.shippingFee)}`);
  if (order.discount > 0) lines.push(`Diskon: -${formatRupiah(order.discount)}`);
  lines.push(`*Total: ${formatRupiah(order.total)}*`, "", `Tanggal: ${when(order)}`);
  if (order.fulfillMethod !== "ambil" && order.deliveryAddress) lines.push(`Alamat: ${order.deliveryAddress}`);

  const dueNow = Math.max(0, order.dpAmount - order.amountPaid);
  if (dueNow > 0) {
    lines.push("", `Mohon DP *${formatRupiah(dueNow)}* supaya pesanan kami proses.`, ...paymentInfo(settings), "Kirim bukti bayar di chat ini ya.");
  } else if (order.amountPaid > 0) {
    lines.push("", `Sudah dibayar: ${formatRupiah(order.amountPaid)}. Sisa: ${formatRupiah(remainingOf(order.total, order.amountPaid))}.`);
  }
  lines.push("", "Terima kasih!");
  return lines.join("\n");
}

export function paymentReminderMessage(ctx: MessageContext): string {
  const { order, customer, settings } = ctx;
  const remaining = remainingOf(order.total, order.amountPaid);
  return [
    `Halo ${customer.name}, mengingatkan pelunasan pesanan *${order.orderNo}* untuk ${when(order)}.`,
    "",
    `Total: ${formatRupiah(order.total)}`,
    `Sudah dibayar: ${formatRupiah(order.amountPaid)}`,
    `*Sisa: ${formatRupiah(remaining)}*`,
    "",
    ...paymentInfo(settings),
    "Kirim bukti bayar di chat ini ya. Terima kasih 🙏",
  ].join("\n");
}

export function readyMessage(ctx: MessageContext): string {
  const { order, customer, settings } = ctx;
  const remaining = remainingOf(order.total, order.amountPaid);
  const lines = [`Halo ${customer.name}, pesanan *${order.orderNo}* sudah siap! 🎉`];
  if (order.fulfillMethod === "ambil") {
    lines.push(settings.pickupAddress ? `Silakan diambil di ${settings.pickupAddress}.` : "Silakan diambil ya.");
  } else {
    lines.push("Pesanan akan segera kami kirim.");
  }
  if (remaining > 0) lines.push("", `Sisa pembayaran: *${formatRupiah(remaining)}*`, ...paymentInfo(settings));
  lines.push("", "Terima kasih!");
  return lines.join("\n");
}

export function shippedMessage(ctx: MessageContext): string {
  const { order, customer } = ctx;
  return [
    `Halo ${customer.name}, pesanan *${order.orderNo}* sudah dikirim ${order.fulfillMethod === "ekspedisi" ? "lewat ekspedisi" : "lewat kurir instan"} 🚚`,
    order.deliveryAddress ? `Tujuan: ${order.deliveryAddress}` : "",
    "",
    "Selamat menikmati, terima kasih sudah order!",
  ]
    .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    .join("\n");
}
