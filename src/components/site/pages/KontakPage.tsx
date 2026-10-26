import { Icon, Script, type IconName } from "@/components/brand";
import { instagramUrl, site } from "@/content/site";
import { waLink } from "@/lib/site/wa";
import { Breadcrumb, Tape } from "../ui";
import { ContactForm } from "./ContactForm";

const H2 = "font-display text-[clamp(30px,5vw,44px)] leading-[1.08] font-bold text-balance";

export function KontakPage() {
  const c = site.contact;
  const channels: { icon: IconName; bg: string; label: string; value: string; sub: string; href: string | null }[] = [
    { icon: "chat", bg: "bg-brand-wine", label: "WhatsApp admin", value: c.whatsappDisplay, sub: c.whatsappHours, href: waLink() },
    { icon: "photo_camera", bg: "bg-brand-espresso", label: "Instagram", value: `@${site.instagram || "mamii.patisserie"}`, sub: "Menu baru & info pre-order", href: instagramUrl(site.instagram) },
    { icon: "mail", bg: "bg-brand-pistachio-deep", label: "Email", value: c.email, sub: "Kerja sama & corporate", href: `mailto:${c.email}` },
  ];
  const pickup: [IconName, string, string][] = [
    ["location_on", "Alamat", c.address],
    ["schedule", "Jam ambil", c.pickupHours],
    ["event_available", "Catatan", "Ambil sesuai jadwal yang dikonfirmasi admin."],
  ];
  const ship: [IconName, string, string][] = [
    ["moped", "Kota Bandung & sekitarnya", "Kurir instan. Ongkir sesuai jarak, dikonfirmasi admin."],
    ["local_shipping", "Luar kota", "Ekspedisi untuk produk frozen dan kue kering, dikemas dengan ice pack."],
    ["storefront", "Ambil sendiri", "Di dapur Mami I sesuai jadwal. Gratis ongkir."],
  ];

  return (
    <div data-page="kontak">
      <section className="px-page bg-brand-butter pt-10 pb-[clamp(48px,7vw,72px)]">
        <div className="flex flex-col gap-[18px]">
          <Breadcrumb current="Kontak" />
          <Script tilt={0}>sapa Mami</Script>
          <h1 className="font-display text-[clamp(38px,6vw,60px)] leading-[1.05] font-bold text-balance">Kontak &amp; pengambilan</h1>
          <p className="max-w-[520px] text-lg leading-[1.6] text-pretty text-brand-muted">
            Admin membalas WhatsApp setiap hari pukul 09.00–18.00. Untuk pesanan, paling cepat lewat halaman checkout.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-5">
          {channels.map((ch) => {
            const inner = (
              <>
                <span className={`flex size-[52px] items-center justify-center rounded-full text-brand-butter ${ch.bg}`}>
                  <Icon name={ch.icon} size={26} />
                </span>
                <span className="text-[13px] font-bold tracking-[.14em] text-brand-pistachio-deep uppercase">{ch.label}</span>
                <span className="font-display text-xl font-bold [overflow-wrap:anywhere]">{ch.value}</span>
                <span className="text-sm text-brand-muted">{ch.sub}</span>
              </>
            );
            const cls = "flex flex-col gap-2.5 bg-white p-6 text-brand-espresso shadow-[0_10px_24px_rgb(62_39_35/.1)]";
            return ch.href ? (
              <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer" className={`${cls} transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_20px_36px_rgb(62_39_35/.16)]`}>
                {inner}
              </a>
            ) : (
              <div key={ch.label} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[13px] text-brand-muted">Nomor WhatsApp, Instagram, dan email masih contoh, belum final.</p>
      </section>

      <section className="px-page bg-brand-butter-50 py-[clamp(52px,8vw,88px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[clamp(28px,5vw,56px)]">
          <div className="relative -rotate-[1.2deg] bg-white p-3.5 shadow-[0_16px_36px_rgb(62_39_35/.16)]">
            {/* PLACEHOLDER: Google Maps embed goes here once the address is final. */}
            <div
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2.5 bg-brand-butter-100 p-5 text-center font-mono text-xs text-brand-muted"
              style={{
                backgroundImage: "linear-gradient(90deg, rgb(62 39 35 / .06) 1px, transparent 1px), linear-gradient(0deg, rgb(62 39 35 / .06) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            >
              <Icon name="location_on" size={44} className="text-brand-wine" />
              <span>peta lokasi · pasang embed Google Maps</span>
            </div>
            <Tape tilt={-8} className="-top-3 left-10" />
          </div>
          <div className="flex flex-col gap-[18px]">
            <Script tilt={0}>ambil sendiri</Script>
            <h2 className={H2}>Dapur Mami I</h2>
            <div className="flex flex-col">
              {pickup.map(([icon, k, v]) => (
                <div key={k} className="flex items-start gap-3.5 border-t-[1.5px] border-dashed border-brand-espresso/20 py-3.5">
                  <span className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-butter text-brand-wine">
                    <Icon name={icon} size={22} />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold tracking-[.12em] text-brand-pistachio-deep uppercase">{k}</span>
                    <span className="text-[17px] leading-normal">{v}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(c.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-full border-[1.5px] border-brand-espresso px-7 font-bold whitespace-nowrap text-brand-espresso"
              >
                <Icon name="map" /> Buka di Google Maps
              </a>
            </div>
            <span className="text-[13px] text-brand-muted">Alamat dan jam masih contoh, belum final.</span>
          </div>
        </div>
      </section>

      <section className="px-page flex flex-col gap-[clamp(28px,4vw,40px)] bg-brand-butter-100 py-[clamp(52px,8vw,88px)]">
        <div className="flex flex-col gap-2">
          <Script tilt={0}>pengiriman</Script>
          <h2 className={H2}>Sampai ke meja Anda</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6">
          {ship.map(([icon, t, d]) => (
            <div key={t} className="flex flex-col gap-3 bg-brand-butter-50 p-7 shadow-[0_1px_0_rgb(62_39_35/.08)]">
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-espresso text-brand-butter">
                <Icon name={icon} size={28} />
              </span>
              <span className="font-display text-[22px] font-bold">{t}</span>
              <span className="text-base leading-[1.55] text-brand-muted">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-page bg-brand-butter-50 py-[clamp(52px,8vw,88px)]">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Script tilt={0}>tulis pesan</Script>
            <h2 className={H2}>Ada yang mau ditanyakan?</h2>
            <p className="max-w-[560px] text-lg leading-[1.6] text-pretty text-brand-muted">Isi formulir ini, pesannya akan terbuka di WhatsApp dan tinggal kamu kirim.</p>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
