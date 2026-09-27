import Link from "next/link";
import { site } from "@/content/site";
import { formatDateId } from "@/lib/preorder/dates";
import { loadCampaigns, loadCatalog } from "@/lib/site/catalog";
import { ProductCard, ProductGrid } from "@/components/site/ProductCard";
import { SectionTitle } from "@/components/site/SectionTitle";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

export const revalidate = 300;

export default async function HomePage() {
  const [catalog, campaigns] = await Promise.all([loadCatalog(), loadCampaigns()]);
  const featured = [...catalog].sort((a, b) => Number(a.fullThisWeek) - Number(b.fullThisWeek)).slice(0, 6);
  const campaign = campaigns[0];

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-butter">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-14 sm:py-20 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted">{site.hero.eyebrow}</p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] text-brand-espresso sm:text-6xl">{site.hero.title}</h1>
            <p className="mt-4 max-w-md text-lg text-brand-muted">{site.hero.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/katalog" className="btn-wine">Lihat Menu</Link>
              <WhatsAppButton text={`Halo ${site.name}, saya mau tanya menu.`} className="btn-outline" />
            </div>
          </div>
          <div className="relative mx-auto hidden aspect-square w-full max-w-xs md:block" aria-hidden>
            <div className="absolute inset-0 rounded-full bg-brand-cream" />
            <div className="absolute inset-6 flex items-center justify-center rounded-full border border-brand-espresso/30">
              <span className="font-display text-7xl italic text-brand-wine">MI</span>
            </div>
            <div className="absolute -right-2 bottom-6 rounded-full bg-brand-pistachio px-4 py-2 text-sm font-semibold text-brand-espresso">24 tahun</div>
          </div>
        </div>
        <p className="border-t border-brand-espresso/10 bg-brand-butter-soft px-4 py-3 text-center text-sm font-semibold text-brand-muted">{site.timeline}</p>
      </section>

      {/* Story */}
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col items-start justify-center rounded-3xl bg-brand-pistachio p-6">
          <p className="font-display text-7xl font-semibold leading-none text-brand-espresso">{site.story.stat.value}</p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-brand-muted">{site.story.stat.label}</p>
        </div>
        <div>
          <SectionTitle eyebrow="Cerita kami" title={site.story.title} />
          {site.story.paragraphs.map((p) => <p key={p} className="mb-3 text-lg leading-relaxed text-brand-muted">{p}</p>)}
        </div>
      </section>

      {/* Campaign */}
      {campaign && (
        <section className="mx-auto max-w-5xl px-4">
          <Link href="/hampers" className="block rounded-3xl bg-brand-espresso p-6 text-brand-butter sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-butter">{campaign.isOpen ? "Preorder dibuka" : "Segera dibuka"}</p>
            <p className="mt-1 font-display text-4xl font-semibold">{campaign.name}</p>
            <p className="mt-2 text-brand-butter/80">
              Preorder {formatDateId(campaign.preorderOpen, false)} – {formatDateId(campaign.preorderClose, false)}
            </p>
            <span className="btn-wine mt-5">Lihat hampers →</span>
          </Link>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionTitle eyebrow="Pilihan Mami" title="Produk unggulan" />
        {featured.length === 0 ? (
          <p className="rounded-3xl bg-brand-butter-soft p-6 text-brand-muted">Menu segera hadir. Ikuti kami untuk kabar terbaru!</p>
        ) : (
          <ProductGrid>
            {featured.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
          </ProductGrid>
        )}
        <div className="mt-6 text-center">
          <Link href="/katalog" className="btn-outline">Lihat semua menu</Link>
        </div>
      </section>

      {/* How to order */}
      <section className="bg-brand-butter-soft">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <SectionTitle eyebrow="Cara pesan" title="Pesan semudah chat" />
          <ol className="grid gap-4 sm:grid-cols-3">
            {site.orderSteps.map((s, i) => (
              <li key={s} className="rounded-3xl bg-brand-cream p-5">
                <span className="font-display text-4xl font-semibold text-brand-wine">{i + 1}</span>
                <p className="mt-1 text-brand-muted">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <WhatsAppButton text={`Halo ${site.name}, saya mau pesan.`} label="Pesan via WhatsApp" />
          </div>
        </div>
      </section>
    </>
  );
}
