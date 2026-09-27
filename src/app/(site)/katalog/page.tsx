import type { Metadata } from "next";
import { WEB_CATEGORIES, WEB_CATEGORY_LABEL } from "@/content/site";
import { loadCatalog } from "@/lib/site/catalog";
import { ProductCard, ProductGrid } from "@/components/site/ProductCard";
import { SectionTitle } from "@/components/site/SectionTitle";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Menu",
  description: "Kue kering, risol & kroket frozen, kue basah, pastry, dan hampers dari Mami I Pâtisserie, Bandung. Pesan via WhatsApp.",
  alternates: { canonical: "/katalog" },
};

export default async function CatalogPage() {
  const catalog = await loadCatalog();
  const groups = WEB_CATEGORIES.map((c) => ({ c, items: catalog.filter((p) => p.category === c) })).filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <SectionTitle eyebrow="Menu" title="Katalog">
        Semua dibuat berdasarkan pesanan (preorder). Harga final dan ongkir dikonfirmasi admin via WhatsApp.
      </SectionTitle>

      {groups.length > 1 && (
        <nav className="sticky top-[58px] z-10 -mx-4 mb-6 flex gap-2 overflow-x-auto bg-brand-cream/95 px-4 py-2 backdrop-blur" aria-label="Kategori">
          {groups.map((g) => (
            <a key={g.c} href={`#${g.c}`} className="shrink-0 rounded-full border border-brand-pistachio px-4 py-2 text-sm font-semibold text-brand-oak hover:bg-brand-pistachio-soft">
              {WEB_CATEGORY_LABEL[g.c]}
            </a>
          ))}
        </nav>
      )}

      {groups.length === 0 && <p className="rounded-3xl bg-white/70 p-6 text-brand-oak">Menu segera hadir. Hubungi kami via WhatsApp untuk info terbaru.</p>}

      {groups.map((g) => (
        <section key={g.c} id={g.c} className="mb-12 scroll-mt-32">
          <h2 className="mb-4 font-display text-3xl font-semibold text-brand-oak-dark">{WEB_CATEGORY_LABEL[g.c]}</h2>
          <ProductGrid>
            {g.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </ProductGrid>
        </section>
      ))}
    </div>
  );
}
