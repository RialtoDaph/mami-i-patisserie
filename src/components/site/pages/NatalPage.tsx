import Image from "next/image";
import { ButtonLink, Icon, Script, StripeDivider } from "@/components/brand";
import { daysUntil, endOfDayJakarta, longDate, longRange, shortDate, shortRange } from "@/content/campaigns";
import { NATAL_PACKAGES, NATAL_SLUG } from "@/content/catalog";
import { site } from "@/content/site";
import { campaignBySlug, type SiteData } from "@/lib/site/data";
import { ScrollToSection } from "../bits";
import { InstagramLink } from "../SiteOverlays";
import { WaButton } from "../ui";
import { NatalPackages } from "./NatalPackages";

/** 22 fairy lights along the top of the hero, following a sine curve. Twinkling is added by the motion layer. */
const LIGHTS = Array.from({ length: 22 }, (_, i) => {
  const ph = (i % 7) / 6;
  const k = i % 3;
  return {
    y: Math.round(2 + Math.sin(ph * Math.PI) * 22),
    c: ["#f5e8aa", "#e8476f", "#c9cd94"][k],
    g: ["rgb(245 232 170 / .75)", "rgb(232 71 111 / .6)", "rgb(201 205 148 / .6)"][k],
  };
});

const SNOW_BANK =
  "radial-gradient(30px 20px at 50% 100%, #fcf8e6 97%, rgb(252 248 230 / 0) 100%) 0 100% / 56px 24px repeat-x, " +
  "radial-gradient(22px 14px at 50% 100%, #fcf8e6 97%, rgb(252 248 230 / 0) 100%) 28px 100% / 56px 24px repeat-x";

const H2 = "font-display text-[clamp(30px,4.5vw,44px)] leading-[1.05] font-bold";

/** Christmas campaign page (takeover of /, /menu, /hampers, /tentang, /faq while modeNatal is on). */
export function NatalPage({ data, scrollTo }: { data: SiteData; scrollTo?: string }) {
  const campaign = campaignBySlug(data.campaigns, NATAL_SLUG);
  const quota = campaign?.quota ?? 0;
  const left = Math.max(0, quota - (campaign?.used ?? 0));
  const close = campaign?.preorderClose ?? "2026-12-18";
  const from = campaign?.fulfillStart ?? "2026-12-20";
  const to = campaign?.fulfillEnd ?? "2026-12-24";
  const days = daysUntil(endOfDayJakarta(close));
  const open = Boolean(campaign?.isOpen) && days > 0 && left > 0;
  const packages = (campaign?.products ?? []).flatMap((cp) => {
    const p = data.products.find((x) => x.id === cp.productId);
    return p && p.slug && NATAL_PACKAGES[p.slug] ? [{ product: p, ...NATAL_PACKAGES[p.slug] }] : [];
  });
  const dp = data.settings.dpPercent;
  const closedMsg = left <= 0 ? "Kuota habis. Chat admin untuk daftar tunggu." : "Pemesanan sudah ditutup.";
  const pct = quota ? Math.round(((quota - left) / quota) * 100) : 0;

  const steps = [
    ["Pilih paket", "Tulis kartu ucapan kalau mau. Mami yang menuliskannya dengan tangan."],
    ["Isi data & tanggal", `Pilih ambil di dapur atau kirim via JNE, tanggal ${shortRange(from, to)}.`],
    ["Bayar", "Transfer BCA atau QRIS, lalu upload bukti bayar."],
    ["Terima hampers", "Ambil sesuai jadwal atau tunggu kurir JNE. Pesanan dikonfirmasi lewat WhatsApp."],
  ];
  const faq = [
    ["Sampai kapan bisa pesan?", `Sampai ${longDate(close)}, atau lebih cepat kalau kuota ${quota} box sudah habis.`],
    ["Kapan hampers diambil atau dikirim?", `Tanggal ${longRange(from, to)}. Kamu pilih tanggalnya saat checkout.`],
    ["Bisa dikirim ke luar kota?", "Bisa, lewat JNE. Ongkir dihitung sesuai tujuan di halaman checkout."],
    ["Bayarnya bagaimana?", `Transfer BCA atau QRIS. Bayar DP ${dp}% untuk mengunci pesanan, atau langsung lunas.`],
    ["Apa saja isinya?", "Kue kering resep Mami dalam toples. Pilihan rasa sedang difinalkan dan akan diumumkan di Instagram."],
    ["Pesan banyak untuk kantor?", "Chat admin lewat WhatsApp, nanti kami bantu hitung."],
  ];

  return (
    <div data-page="natal">
      {scrollTo && <ScrollToSection id={scrollTo} />}

      <section
        id="nt-hero"
        data-snow-hero
        className="px-page relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[clamp(36px,6vw,64px)] overflow-hidden bg-brand-natal pt-10 pb-[clamp(56px,8vw,88px)] text-brand-butter-50"
      >
        <canvas id="nt-snow" aria-hidden className="pointer-events-none absolute inset-0 z-[3] size-full" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex justify-between px-3">
          {LIGHTS.map((l, i) => (
            <span
              key={i}
              data-twinkle
              className="h-3 w-[9px] flex-none rounded-[50%_50%_45%_45%]"
              style={{ marginTop: l.y, background: l.c, boxShadow: `0 0 12px 3px ${l.g}` }}
            />
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px z-[4] h-6" style={{ background: SNOW_BANK }} />

        <div className="flex flex-col gap-[22px]">
          <Script size={26} className="text-brand-butter">
            hampers natal 2026
          </Script>
          <h1 id="nt-h1" className="font-display text-[clamp(40px,6.5vw,68px)] leading-[1.02] font-bold text-balance">
            Kue kering Natal, <em className="font-normal text-brand-butter">dari dapur Mami.</em>
          </h1>
          <p className="max-w-[500px] text-lg leading-[1.6] text-pretty">
            Resep keluarga Mami selama 24 tahun, dikemas dalam box hampers dengan pita satin dan kartu ucapan yang Mami tulis dengan tangan.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="#paket" variant="butter" className="text-brand-natal">
              Pilih paket
            </ButtonLink>
            <ButtonLink href="#cara" variant="outline-light" className="px-[22px]">
              Cara pesan
            </ButtonLink>
          </div>
          <div className="flex max-w-[420px] flex-col gap-2 pt-1.5">
            <div className="flex justify-between gap-3 text-sm font-bold">
              <span>
                Sisa {left} dari {quota} box
              </span>
              <span className="text-brand-butter">{days > 0 ? `${days} hari lagi` : "Ditutup"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-butter-50/20">
              <div id="nt-bar" className="h-full min-w-1 origin-left bg-brand-butter" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div data-tilt="hero" className="relative z-[2] w-[min(100%,460px)] justify-self-center pb-10 pl-6">
          <div id="nt-photo" className="relative rotate-[2.5deg] bg-brand-butter-50 px-3 pt-3 pb-12 shadow-[0_24px_48px_rgb(0_0_0/.35)]">
            <div className="relative aspect-[4/5]">
              <Image
                src="/images/hampers-kue-kering.jpg"
                alt="Hampers kue kering dalam box burgundy dengan pita"
                fill
                priority
                sizes="(max-width: 760px) 90vw, 460px"
                className="object-cover"
                style={{ objectPosition: "58% 50%" }}
              />
            </div>
            <span data-glare aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300" />
            <span className="absolute right-[18px] bottom-2 font-script text-2xl text-brand-wine">Merry Christmas</span>
          </div>
        </div>
      </section>

      <StripeDivider height={14} light="butter-50" />
      <div className="px-page flex flex-wrap justify-center gap-x-10 gap-y-2.5 bg-brand-espresso py-[18px] text-[15px] font-semibold text-brand-butter">
        <span className="flex items-center gap-2">
          <Icon name="event_available" /> Pesan sampai {shortDate(close)}
        </span>
        <span className="flex items-center gap-2">
          <Icon name="storefront" /> Ambil di dapur · {shortRange(from, to)}
        </span>
        <span className="flex items-center gap-2">
          <Icon name="local_shipping" /> Kirim lewat JNE
        </span>
      </div>

      <section id="paket" className="px-page flex scroll-mt-[72px] flex-col gap-[clamp(28px,4vw,40px)] bg-brand-butter-50 py-[clamp(52px,8vw,88px)]">
        <div className="flex flex-col gap-1.5">
          <Script tilt={0}>pilih paketmu</Script>
          <h2 className={H2}>Tiga ukuran hampers</h2>
          <p className="mt-1.5 max-w-[560px] text-[15px] leading-normal text-brand-muted">Foto, harga, dan isi di bawah masih contoh. Rasa kue kering sedang difinalkan.</p>
        </div>
        <NatalPackages packages={packages} open={open} closedMsg={closedMsg} />
      </section>

      <section id="cara" className="px-page flex scroll-mt-[72px] flex-col gap-[clamp(28px,4vw,40px)] bg-brand-butter py-[clamp(52px,8vw,88px)]">
        <div className="flex flex-col gap-1.5">
          <Script tilt={0}>gampang kok</Script>
          <h2 className={H2}>Cara pesan</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-5">
          {steps.map(([t, d], i) => (
            <div key={t} className="flex flex-col gap-2.5 bg-brand-butter-50 p-[22px] shadow-[0_10px_24px_rgb(62_39_35/.1)]">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-natal font-bold text-brand-butter">{i + 1}</span>
              <b className="font-display text-[19px]">{t}</b>
              <span className="text-[15px] leading-normal text-brand-muted">{d}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
          <div className="flex flex-col gap-2 bg-brand-natal p-6 text-brand-butter-50">
            <b className="font-display text-xl">Ambil di dapur Mami I</b>
            <span className="text-[15px] leading-normal">{site.contact.address} · {shortRange(from, to)} {to.slice(0, 4)} · jam 10.00–17.00. Gratis.</span>
          </div>
          <div className="flex flex-col gap-2 bg-brand-natal p-6 text-brand-butter-50">
            <b className="font-display text-xl">Kirim lewat JNE</b>
            <span className="text-[15px] leading-normal">Ke seluruh Indonesia. Ongkir dihitung sesuai tujuan di halaman checkout.</span>
          </div>
        </div>
      </section>

      <section id="tanya" className="px-page flex scroll-mt-[72px] flex-col gap-[clamp(28px,4vw,40px)] bg-brand-butter-50 py-[clamp(52px,8vw,88px)]">
        <div className="flex flex-col gap-1.5">
          <Script tilt={0}>yang sering ditanya</Script>
          <h2 className={H2}>Tanya jawab</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
          {faq.map(([q, a]) => (
            <div key={q} className="flex flex-col gap-2 border-t-2 border-brand-espresso pt-4">
              <b className="font-display text-lg leading-[1.3]">{q}</b>
              <span className="text-base leading-[1.55] text-pretty text-brand-muted">{a}</span>
            </div>
          ))}
        </div>
        <WaButton
          text="Halo Mami I Patisserie, saya mau tanya pesanan hampers Natal dalam jumlah besar."
          className="inline-flex min-h-[52px] items-center gap-2 self-start rounded-full border-[1.5px] border-brand-espresso px-6 font-bold text-brand-espresso"
        >
          Pesan banyak? Chat admin
        </WaButton>
      </section>

      <section className="px-page flex flex-wrap items-center justify-between gap-7 bg-brand-espresso py-[clamp(44px,7vw,72px)] text-brand-butter">
        <div className="flex flex-[1_1_320px] flex-col gap-2">
          <Script tilt={0} className="text-brand-pistachio">
            segera hadir, Oktober 2027
          </Script>
          <h2 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.1] font-bold">Toko &amp; kafe Mami I</h2>
          <span className="text-base leading-normal text-brand-butter-50">Sekarang kami baru melayani hampers. Ikuti Instagram untuk kabar berikutnya.</span>
        </div>
        <InstagramLink className="inline-flex min-h-[52px] items-center rounded-full bg-brand-butter px-7 font-bold text-brand-espresso">@{site.instagram}</InstagramLink>
      </section>
    </div>
  );
}
