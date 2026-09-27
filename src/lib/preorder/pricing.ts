import type { Campaign, Product } from "./types";

/** Unit price for a product, using the campaign's override when present. */
export function unitPriceFor(product: Pick<Product, "id" | "price">, campaign: Pick<Campaign, "products"> | null): number {
  const override = campaign?.products.find((p) => p.productId === product.id)?.priceOverride;
  return override ?? product.price;
}
