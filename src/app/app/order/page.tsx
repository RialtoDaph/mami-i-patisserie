import type { Metadata } from "next";
import { loadPreorderData } from "@/lib/preorderData";
import { parseOrderFilter } from "@/lib/orderParams";
import { OrderList } from "./OrderList";

export const metadata: Metadata = { title: "Order" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filter = parseOrderFilter(await searchParams);
  const data = await loadPreorderData();
  return (
    <div className="max-w-[860px]">
      <OrderList data={data} filter={filter} />
    </div>
  );
}
