// Client-safe shapes of the public website data (loaded server-side in data.ts).

export interface WebProduct {
  id: string;
  slug: string | null;
  name: string;
  desc: string;
  /** products.web_category: pastry | frozen | hampers | … */
  category: string;
  /** Effective price (campaign price when the product is in an open campaign). */
  price: number;
  /** Price is still a sample / not final. */
  pricePending: boolean;
  /** Show the price on cards; otherwise "harga menyusul". */
  showPrice: boolean;
  img: string | null;
  photoNote: string;
  minLeadDays: number;
}
