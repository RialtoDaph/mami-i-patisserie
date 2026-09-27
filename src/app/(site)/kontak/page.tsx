import type { Metadata } from "next";
import { instagramUrl, site } from "@/content/site";
import { SectionTitle } from "@/components/site/SectionTitle";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

export const metadata: Metadata = {
  title: "Kontak & Pengiriman",
  description: "Hubungi Mami I Pâtisserie via WhatsApp atau Instagram. Info area pengiriman dan pengambilan di Bandung.",
  alternates: { canonical: "/kontak" },
};

export default function ContactPage() {
  const ig = instagramUrl(site.instagram);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SectionTitle eyebrow="Kontak" title="Kami senang mendengar dari Anda">
        Semua pesanan dan pertanyaan kami layani lewat WhatsApp.
      </SectionTitle>

      <div className="mb-10 flex flex-col gap-3 sm:flex-row">
        <WhatsAppButton text={`Halo ${site.name}, saya mau tanya.`} label="Chat WhatsApp" className="btn-wine flex-1" />
        {ig && (
          <a href={ig} target="_blank" rel="noopener noreferrer" className="btn-oak-outline flex-1">
            Instagram @{site.instagram}
          </a>
        )}
      </div>
      {!site.whatsapp && <p className="mb-6 rounded-2xl bg-brand-butter-soft p-4 text-sm">Nomor WhatsApp belum diatur (NEXT_PUBLIC_WHATSAPP_NUMBER).</p>}

      <h2 className="mb-4 font-display text-3xl font-semibold">Pengiriman & pengambilan</h2>
      <ul className="mb-10 grid gap-3">
        {site.delivery.map((d) => (
          <li key={d.title} className="rounded-3xl bg-white/70 p-5 ring-1 ring-brand-oak/10">
            <p className="font-semibold text-brand-oak-dark">{d.title}</p>
            <p className="mt-1 text-brand-oak">{d.text}</p>
          </li>
        ))}
      </ul>

      <div className="rounded-3xl bg-brand-butter p-6">
        <p className="font-display text-2xl font-semibold">{site.name} · {site.city}</p>
        <p className="mt-1 text-brand-oak">{site.timeline}</p>
      </div>
    </div>
  );
}
