import type { Metadata } from "next";
import { site } from "@/content/site";
import { formatDateId } from "@/lib/preorder/dates";
import { loadCampaigns, loadCatalog } from "@/lib/site/catalog";
import { ProductCard, ProductGrid } from "@/components/site/ProductCard";
import { SectionTitle } from "@/components/site/SectionTitle";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Hampers & Blessings Box",
  description: "Hampers hari raya dan Blessings Box dari Mami I Pâtisserie. Preorder terbatas, pesan via WhatsApp.",
  alternates: { canonical: "/hampers" },
};

export default async function HampersPage() {
  const [catalog, campaigns] = await Promise.all([loadCatalog(), loadCampaigns()]);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const regular = catalog.filter((p) => p.category === "hampers");

  return (
    <>
      <section className="bg-brand-oak-dark text-brand-cream">
        <div className="awning h-2" aria-hidden />
        <div className="mx-auto max-w-5xl px-4 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-butter">Untuk orang-orang tersayang</p>
          <h1 className="mt-2 font-display text-5xl font-semibold leading-tight">Hampers & Blessings Box</h1>
          <p className="mt-3 max-w-xl text-brand-cream/80">
            Kotak berisi kue-kue pilihan Mami, dikemas cantik dengan kartu ucapan. Kuota terbatas setiap minggu.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10">
        {campaigns.map((c) => {
          const items = c.products.map((cp) => ({ product: byId.get(cp.productId), price: cp.price })).filter((x) => x.product);
          return (
            <section key={c.id} className="mb-12">
              <div className="mb-5 rounded-3xl bg-brand-butter p-5">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${c.isOpen ? "bg-brand-wine text-brand-cream" : "bg-brand-pistachio text-brand-cream"}`}>
                  {c.isOpen ? "Preorder dibuka" : `Segera dibuka · ${formatDateId(c.preorderOpen, false)}`}
                </span>
                <h2 className="mt-2 font-display text-4xl font-semibold text-brand-oak-dark">{c.name}</h2>
                <p className="mt-1 text-brand-oak">
                  Preorder {formatDateId(c.preorderOpen, false)} – {formatDateId(c.preorderClose, false)}
                  {c.fulfillStart && c.fulfillEnd && <> · Dikirim/diambil {formatDateId(c.fulfillStart, false)} – {formatDateId(c.fulfillEnd, false)}</>}
                </p>
              </div>
              {items.length > 0 ? (
                <ProductGrid>
                  {items.map(({ product, price }) => (
                    <ProductCard
                      key={product!.id}
                      product={product!}
                      price={price}
                      campaign={{ id: c.id, name: c.name }}
                      unavailableLabel={c.isOpen ? null : `Dibuka ${formatDateId(c.preorderOpen, false)}`}
                    />
                  ))}
                </ProductGrid>
              ) : (
                <p className="text-brand-oak">Pilihan produk segera diumumkan.</p>
              )}
            </section>
          );
        })}

        {regular.length > 0 && (
          <section className="mb-12">
            <SectionTitle eyebrow="Sepanjang tahun" title="Hampers & box" />
            <ProductGrid>
              {regular.map((p) => <ProductCard key={p.id} product={p} />)}
            </ProductGrid>
          </section>
        )}

        {campaigns.length === 0 && regular.length === 0 && (
          <p className="mb-8 rounded-3xl bg-white/70 p-6 text-brand-oak">Belum ada campaign hampers yang dibuka. Tanyakan hampers custom via WhatsApp.</p>
        )}

        <div className="rounded-3xl bg-brand-pistachio-soft p-6 text-center">
          <p className="font-display text-3xl font-semibold text-brand-oak-dark">Butuh hampers untuk kantor atau acara?</p>
          <p className="mt-2 text-brand-oak">Kami bantu susun isi dan jumlahnya.</p>
          <div className="mt-4">
            <WhatsAppButton text={`Halo ${site.name}, saya mau tanya hampers custom.`} label="Tanya hampers custom" />
          </div>
        </div>
      </div>
    </>
  );
}
