import "server-only";
import { orderCountByCustomer, todayJakarta, type Customer, type Order } from "@/lib/preorder";
import { productPhotoUrl, type PreorderData } from "@/lib/preorderData";
import type { OrderFormProps } from "./OrderForm";

/** Server-side props for OrderForm. */
export function orderFormProps(
  data: PreorderData,
  initial: { order: Order; customer: Customer } | null,
  prefillCustomer: Customer | null = null,
): OrderFormProps {
  const counts = orderCountByCustomer(data.orders);
  return {
    products: data.products.map((p) => ({ ...p, photoUrl: productPhotoUrl(p.photoPath) })),
    campaigns: data.campaigns,
    customers: data.customers.map((c) => ({ ...c, orderCount: counts.get(c.id) ?? 0 })),
    orders: data.orders,
    settings: data.settings,
    today: todayJakarta(),
    initial,
    prefillCustomer,
  };
}
