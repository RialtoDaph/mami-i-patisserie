import Image from "next/image";
import { formatRupiah } from "@/lib/format";
import type { PublicProduct } from "@/lib/site/catalog";
import { AddToCartButton } from "./AddToCartButton";

export function ProductPhoto({ url, name, priority = false }: { url: string | null; name: string; priority?: boolean }) {
  if (!url) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-brand-butter-soft">
        <span className="font-display text-5xl text-brand-oak/40" aria-hidden>MI</span>
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={name}
      width={600}
      height={600}
      sizes="(min-width: 768px) 30vw, 50vw"
      priority={priority}
      className="aspect-square w-full rounded-2xl object-cover"
    />
  );
}

export function ProductCard({
  product,
  price = product.price,
  campaign = null,
  priority = false,
  unavailableLabel = null,
}: {
  product: PublicProduct;
  price?: number;
  campaign?: { id: string; name: string } | null;
  priority?: boolean;
  /** When set, the product cannot be added yet (e.g. campaign not open). */
  unavailableLabel?: string | null;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-3xl bg-white/70 p-2.5 shadow-sm ring-1 ring-brand-oak/10">
      <div className="relative">
        <ProductPhoto url={product.photoUrl} name={product.name} priority={priority} />
        {product.fullThisWeek && (
          <span className="absolute top-2 left-2 rounded-full bg-brand-wine px-2.5 py-1 text-[11px] font-bold text-brand-cream">
            Kuota minggu ini penuh
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1">
        <h3 className="font-display text-xl font-semibold leading-tight text-brand-oak-dark">{product.name}</h3>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-brand-oak/80">{product.description}</p>}
        <p className="mt-auto pt-2 font-semibold text-brand-oak-dark">
          {formatRupiah(price)}
          {price !== product.price && <span className="ml-2 text-xs font-normal text-brand-oak/60 line-through">{formatRupiah(product.price)}</span>}
        </p>
      </div>
      {unavailableLabel ? (
        <p className="flex min-h-11 items-center justify-center rounded-full bg-brand-pistachio-soft px-3 text-center text-sm font-semibold text-brand-oak">
          {unavailableLabel}
        </p>
      ) : (
        <AddToCartButton
          item={{
            productId: product.id,
            name: product.name,
            unitPrice: price,
            campaignId: campaign?.id ?? null,
            campaignName: campaign?.name ?? null,
            minLeadDays: product.minLeadDays,
          }}
        />
      )}
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">{children}</div>;
}
