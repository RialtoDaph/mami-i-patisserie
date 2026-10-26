import Image from "next/image";
import Link from "next/link";
import { ButtonLink, Icon, Script, Sticker } from "@/components/brand";
import { DRINKS, HAMPERS_BOXES } from "@/content/catalog";
import { bySlug, type SiteData } from "@/lib/site/data";
import { AddButton, AutoVideo } from "../bits";
import { InstagramLink } from "../SiteOverlays";
import { PriceTag, Tape, WaButton } from "../ui";
import { GreetingCardTeaser } from "./HomeIslands";

const H2 = "font-display text-[clamp(30px,7.5vw,45px)] leading-none font-bold";
const PILL = "inline-flex min-h-[52px] items-center justify-center whitespace-nowrap rounded-full px-7 font-bold transition-[transform,filter] hover:brightness-[.92] active:scale-[.97]";
const LINK_U = "self-start whitespace-nowrap border-b-[1.5px] border-brand-espresso pb-[3px] font-bold text-brand-espresso";

const KAFE_NOTES = [
  ["01", "Grand Pastry Island", "Etalase pastry di tengah ruangan, langsung dari oven."],
  ["02", "Bar kopi ubin pistachio", "Counter kopi dengan ubin zellige hijau pistachio."],
  ["03", "Studio kaca", "Ruang kelas cupcake berbingkai kayu oak."],
];

const SHIPPING = [
  ["moped", "Kota Bandung & sekitarnya", "Dikirim dengan kurir instan. Ongkir tarif tetap per area, langsung terhitung saat checkout."],
  ["local_shipping", "Luar kota", "Untuk kue kering dan hampers yang tahan lama, dikirim via ekspedisi."],
  ["storefront", "Ambil sendiri", "Alamat pengambilan diinformasikan via WhatsApp setelah order dikonfirmasi."],
] as const;

const ORDER_STEPS = [
  "Pilih produk dan masukkan ke keranjang.",
  "Isi data, pilih tanggal (minimal 2 hari lagi) dan cara ambil atau kirim.",
  "Bayar DP 40% atau lunas lewat QRIS atau transfer BCA, lalu upload bukti. Selesai.",
];

const IG = [
  ["/images/cold-brew.jpg", "Pistachio cream cold brew", -4],
  ["/images/pistachio-croissant.jpg", "Pistachio & almond croissant", 3],
  ["/images/cupcake-1.jpg", "Cupcake Mami I", -2],
  ["/images/blessings-box.jpg", "Blessings Box", 5],
  ["/images/pastry-island.jpg", "Grand Pastry Island", -3],
  ["/images/minibar.jpg", "Mini Bar Mami I, bar bundar ubin pistachio", -3],
  ["/images/tampak-depan.jpg", "Tampak depan Mami I Patisserie", 4],
] as const;

/** Beranda outside the Christmas campaign. Hero = "sekarang" (arched frame + round 24 sticker), final per Alto. */
export function HomePage({ data }: { data: SiteData }) {
  const box = HAMPERS_BOXES[0];
  const boxProduct = bySlug(data.products, box.slug);
  const pastries = data.products.filter((p) => p.category === "pastry");
  return (
    <div data-page="beranda">
      <section className="px-page grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-14 bg-brand-butter pt-10 pb-[72px]">
        <div className="flex flex-col gap-[22px]">
          <Script size={26} tilt={-3}>
            freshly baked daily
          </Script>
          <h1 className="font-display text-[clamp(44px,5vw,62px)] leading-none font-bold text-balance">
            Where Mami&apos;s Recipes <em className="font-normal text-brand-wine">Meet Modern Pastry.</em>
          </h1>
          <p className="max-w-[470px] text-[19px] leading-[1.55] text-brand-muted">
            Resep keluarga Mami selama 24 tahun, dipadukan teknik pâtisserie modern. Dibuat segar setiap hari di Bandung.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/menu">Lihat Menu</ButtonLink>
            <WaButton className={`${PILL} border-[1.5px] border-brand-espresso text-brand-espresso`}>Chat WhatsApp</WaButton>
          </div>
        </div>
        <div className="relative w-full max-w-[440px] justify-self-center">
          <div className="overflow-hidden border-[12px] border-brand-espresso" style={{ borderRadius: "220px 220px 6px 6px" }}>
            <div className="relative aspect-[11/13] overflow-hidden bg-brand-butter-100">
              {/* AI image + AI video: placeholders until real footage of the shop window exists. */}
              <Image src="/images/hero-etalase-ai.jpg" alt="Etalase pastry Mami I (ilustrasi AI)" fill priority sizes="(max-width: 760px) 90vw, 440px" className="object-cover" />
              <AutoVideo src="/video/hero-etalase-v2.mp4" poster="/images/hero-etalase-ai.jpg" className="absolute inset-0 size-full object-cover" />
              <span className="absolute bottom-3 left-3 z-[1] rounded bg-brand-espresso/75 px-2 py-1.5 font-mono text-[11px] leading-none font-medium text-brand-butter">
                contoh video · dibuat AI
              </span>
            </div>
          </div>
          <div className="-mx-[18px] h-3.5 rounded-[3px] bg-brand-espresso" />
          <Sticker big="24" small="tahun resep" tilt={10} className="absolute top-[70px] -right-6" />
        </div>
      </section>

      <div className="px-page flex flex-wrap justify-center gap-x-7 gap-y-1.5 bg-brand-espresso py-4 text-center text-[15px] font-semibold tracking-[.04em] text-brand-butter">
        <span>Pesan online mulai Januari 2027</span>
        <span className="text-brand-pistachio">●</span>
        <span>Kafe kami buka Oktober 2027</span>
      </div>

      <section id="menu" className="px-page flex scroll-mt-[72px] flex-col gap-10 bg-brand-butter-100 py-[clamp(52px,9vw,88px)]">
        <div className="flex flex-col items-center gap-1">
          <Script tilt={0}>dari buku resep Mami</Script>
          <h2 className={`${H2} text-center`}>Freshly Baked Daily Pastry</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(max(150px,calc((100%-84px)/4)),1fr))] gap-[clamp(14px,2.5vw,28px)]">
          {pastries.map((p, i) => (
            <article
              key={p.id}
              className="group relative flex flex-col gap-3 border-t-[3px] border-brand-wine bg-white px-[18px] py-5 shadow-[0_10px_24px_rgb(62_39_35/.1)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgb(62_39_35/.18)]"
              style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 31px, rgb(62 39 35 / .1) 31px 32px)" }}
            >
              <Tape tilt={6} className="-top-3.5 right-[18px]" />
              <div className="relative aspect-[4/3] overflow-hidden bg-brand-butter-100">
                <Image src={p.img ?? "/images/croissant.jpg"} alt={p.name} fill sizes="(max-width: 760px) 50vw, 25vw" priority={i < 2} className="object-cover transition-transform duration-500 ease-(--ease-pop) group-hover:scale-[1.06]" />
              </div>
              <span className="font-script text-[26px] leading-[1.1] font-bold">{p.name}</span>
              <span className="text-sm leading-normal text-brand-muted">{p.desc}</span>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5">
                <PriceTag product={p} />
                <AddButton productId={p.id} label="+ Keranjang" icon={null} size="sm" block className="min-h-11" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-page grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-14 bg-brand-butter py-[clamp(52px,9vw,80px)]">
        <div className="grid grid-cols-2 gap-4">
          {(["/images/cupcake-1.jpg", "/images/cupcake-2.jpg"] as const).map((src, i) => (
            <div
              key={src}
              className={`group relative aspect-[3/4] overflow-hidden bg-brand-butter-100 shadow-[12px_12px_0_var(--color-brand-wine)] ${i ? "mt-12" : ""}`}
              style={{ borderRadius: "200px 200px 8px 8px" }}
            >
              <Image src={src} alt={`Cupcake ${i + 1}`} fill sizes="(max-width: 760px) 45vw, 280px" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-[18px]">
          <Script tilt={0}>Di kafe · Oktober 2027</Script>
          <h2 className="font-display text-[clamp(30px,7.5vw,46px)] leading-[1.05] font-bold">The Couple&apos;s Cupcake Collection</h2>
          <p className="text-lg leading-[1.6]">Koleksi cupcake Mami I, hadir di kafe bersama kelas cupcake di studio kaca.</p>
          <div className="flex flex-wrap gap-3">
            <WaButton className={`${PILL} bg-brand-wine text-brand-butter`}>Tanya via WhatsApp</WaButton>
          </div>
        </div>
      </section>

      <section id="hampers" className="px-page grid scroll-mt-[72px] grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-10 bg-brand-wine py-[clamp(52px,9vw,88px)] text-brand-butter">
        <div className="flex flex-col gap-[18px]">
          <Script tilt={0} className="text-brand-butter">
            resep rahasia
          </Script>
          <h2 className="font-display text-[clamp(30px,7.5vw,48px)] leading-none font-bold">Mami&apos;s Signature Recipe</h2>
          <p className="text-lg leading-[1.55] text-brand-butter-50">Hampers kue kering dari resep yang dikunci Mami selama 24 tahun.</p>
          <div className="relative aspect-[4/3] overflow-hidden bg-brand-butter-100">
            <Image src="/images/hampers-kue-kering.jpg" alt="Box hampers kue kering (cetakan wine)" fill sizes="(max-width: 760px) 90vw, 560px" className="object-cover" />
          </div>
          <Link href="/hampers" className={`${PILL} self-start bg-brand-butter text-brand-wine`}>
            Lihat hampers →
          </Link>
        </div>
        <div className="relative flex flex-col gap-5 bg-brand-butter-50 p-[clamp(22px,4vw,40px)] text-brand-espresso">
          <div className="relative -mx-2 -mt-2 mb-1 aspect-video overflow-hidden bg-brand-butter-100">
            <Image src="/images/blessings-box.jpg" alt="" fill sizes="(max-width: 760px) 90vw, 560px" className="object-cover" />
            <AutoVideo src="/video/blessings-box.mp4" poster="/images/blessings-box.jpg" className="absolute inset-0 size-full object-cover" />
          </div>
          <Script tilt={0}>Paket silaturahmi calon mertua</Script>
          <h3 className="font-display text-[clamp(30px,7.5vw,41px)] leading-none font-bold">Mami&apos;s Blessings Box</h3>
          <ul className="flex flex-col gap-2.5">
            {box.items.map(([q, n]) => (
              <li key={n} className="flex items-baseline gap-3 text-[17px]">
                <span className="w-7 font-display text-[21px] font-bold text-brand-wine">{q}×</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
          <GreetingCardTeaser text="Bawa martabak sudah biasa. Ini bingkisan spesial dari Mami I untuk Mami-Papi di rumah. Semoga suka!" />
          {boxProduct && <AddButton productId={boxProduct.id} label="+ Keranjang" icon={null} size="lg" block />}
        </div>
      </section>

      <section id="tentang" className="px-page grid scroll-mt-[72px] grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[72px] py-[clamp(52px,9vw,96px)]">
        <div className="relative">
          <figure className="relative -rotate-[2.5deg] bg-white px-4 pt-4 pb-14 shadow-[0_16px_36px_rgb(62_39_35/.16)]">
            <div className="relative aspect-square overflow-hidden bg-brand-butter-100">
              <Image src="/images/mami-dapur.jpg" alt="Mami di dapur" fill sizes="(max-width: 760px) 90vw, 520px" className="object-cover" />
            </div>
            <figcaption className="absolute bottom-3.5 left-5 font-script text-[22px]">Mami, dapur Bandung</figcaption>
          </figure>
          <Sticker big="24" small="tahun resep" size={120} className="absolute -top-6 -right-7" />
        </div>
        <div className="flex flex-col gap-[18px]">
          <Script tilt={0}>Cerita kami</Script>
          <h2 className="font-display text-[clamp(30px,7.5vw,46px)] leading-[1.05] font-bold">Dari dapur Mami</h2>
          <p className="text-lg leading-[1.65] text-brand-muted">
            Selama 24 tahun, resep-resep di dapur Mami hanya dinikmati keluarga dan sahabat: kue kering di setiap hari raya, risol untuk arisan, kue basah untuk sore hari.
          </p>
          <p className="text-lg leading-[1.65] text-brand-muted">
            Kini resep warisan itu kami bagikan lebih luas, dengan bahan yang dipilih teliti dan sentuhan pâtisserie ala Paris, tanpa kehilangan rasa rumahnya.
          </p>
          <Link href="/tentang" className={LINK_U}>
            Baca cerita lengkap →
          </Link>
        </div>
      </section>

      <section
        id="minuman"
        className="px-page flex scroll-mt-[72px] justify-center bg-brand-pistachio py-[clamp(52px,9vw,88px)]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #fcf8e6 2px, transparent 2px), linear-gradient(0deg, #fcf8e6 2px, transparent 2px), radial-gradient(circle at 30% 25%, rgb(255 255 255 / .35), transparent 45%)",
          backgroundSize: "64px 64px",
        }}
      >
        <div className="flex w-[720px] max-w-full flex-col gap-[22px] bg-brand-butter-50 px-[clamp(20px,6vw,56px)] py-[clamp(28px,6vw,48px)] shadow-[0_24px_48px_rgb(62_39_35/.25)]">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Script tilt={0}>Bar kopi · di kafe, Okt 2027</Script>
            <h2 className="font-display text-[clamp(30px,7.5vw,40px)] leading-none font-bold">Coffee, Tea &amp; Mocktail</h2>
          </div>
          {DRINKS.map((d) => (
            <div key={d.name} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-[21px] font-bold">{d.name}</span>
                <span aria-hidden className="flex-1 -translate-y-[5px] border-b-2 border-dotted border-brand-espresso/30" />
                <span className="font-script text-lg text-brand-muted">–</span>
              </div>
              {d.desc && <span className="text-sm text-brand-muted">{d.desc}</span>}
            </div>
          ))}
        </div>
      </section>

      <section id="kafe" className="px-page grid scroll-mt-[72px] grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-16 py-[clamp(52px,9vw,88px)]">
        <figure className="relative -rotate-[1.5deg] bg-white p-3.5 shadow-[0_16px_36px_rgb(62_39_35/.16)]">
          <div className="relative aspect-[4/3] overflow-hidden bg-brand-butter-100">
            <Image src="/images/tampak-depan.jpg" alt="Tampak depan Mami I Patisserie (ilustrasi AI)" fill sizes="(max-width: 760px) 90vw, 560px" className="object-cover" />
          </div>
          <Tape tilt={-8} className="-top-3 left-10" />
          <Tape tilt={7} className="-top-3 right-10" />
        </figure>
        <div className="flex flex-col gap-[22px]">
          <Script>catatan untuk Oktober 2027</Script>
          <h2 className="font-display text-[clamp(30px,7.5vw,41px)] leading-none font-bold">Kafe Mami I sedang disiapkan</h2>
          {KAFE_NOTES.map(([n, t, d]) => (
            <div key={n} className="flex items-baseline gap-3.5">
              <span className="font-script text-2xl text-brand-wine">{n}</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-[19px] font-bold">{t}</span>
                <span className="text-[15px] text-brand-muted">{d}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pengiriman" className="px-page flex scroll-mt-[72px] flex-col gap-9 bg-brand-butter-100 py-[clamp(52px,9vw,80px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex flex-col gap-2">
            <Script tilt={0}>Pengiriman</Script>
            <h2 className={H2}>Sampai ke meja Anda</h2>
          </div>
          <Link href="/kontak" className={LINK_U}>
            Detail di Kontak →
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6">
          {SHIPPING.map(([icon, t, d]) => (
            <div key={t} className="flex flex-col gap-3 bg-brand-butter-50 p-7 shadow-[0_1px_0_rgb(62_39_35/.08)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgb(62_39_35/.18)]">
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-espresso text-brand-butter">
                <Icon name={icon} size={28} />
              </span>
              <span className="font-display text-[22px] font-bold">{t}</span>
              <span className="text-base leading-[1.55] text-brand-muted">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="cara-pesan" className="px-page grid scroll-mt-[72px] grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-center gap-[72px] bg-brand-butter py-[clamp(52px,9vw,88px)]">
        <div className="flex flex-col gap-6">
          <h2 className={H2}>Pesan dalam 3 langkah</h2>
          <ol className="flex flex-col gap-[18px]">
            {ORDER_STEPS.map((t, i) => (
              <li key={t} className="flex items-start gap-[18px]">
                <span className="flex size-11 flex-none items-center justify-center rounded-full bg-brand-espresso font-display text-[17px] font-bold text-brand-butter">{i + 1}</span>
                <p className="pt-2 text-[17px] leading-normal">{t}</p>
              </li>
            ))}
          </ol>
          <div>
            <ButtonLink href="/menu">Mulai pesan</ButtonLink>
          </div>
        </div>
        {/* Illustration of an order summary (sample prices). */}
        <div className="flex flex-col overflow-hidden rounded-[28px] border-[1.5px] border-brand-espresso bg-brand-butter-50">
          <div className="flex items-center justify-between gap-3 bg-brand-espresso px-5 py-4 text-brand-butter">
            <span className="font-bold">Pesanan MIP-0012</span>
            <span className="rounded-full bg-brand-pistachio px-2.5 py-1 text-[13px] font-bold text-brand-espresso">DP diterima</span>
          </div>
          <div className="flex flex-col gap-2.5 px-5 pt-[22px] pb-[26px] text-[15px] leading-normal">
            <div className="flex justify-between gap-3">
              <span>1× Mami&apos;s Blessings Box</span>
              <b>Rp 250.000</b>
            </div>
            <div className="flex justify-between gap-3">
              <span>2× Mami&apos;s Classic Croissant</span>
              <b>Rp 116.000</b>
            </div>
            <div className="flex justify-between gap-3 text-brand-muted">
              <span>Ambil sendiri · Sab, 14 Nov</span>
              <span>Rp 0</span>
            </div>
            <div className="flex justify-between gap-3 border-t-[1.5px] border-dashed border-brand-espresso/30 pt-2.5">
              <span>DP 40% · QRIS</span>
              <b className="text-brand-wine">Rp 150.000</b>
            </div>
            <span className="self-end font-mono text-[11px] font-medium text-brand-muted">ilustrasi · harga contoh</span>
          </div>
        </div>
      </section>

      <IgGallery />
    </div>
  );
}

/** Instagram polaroid strip (Beranda + Tentang). Real posts come later; these are the shop's own photos. */
export function IgGallery() {
  return (
    <section className="px-page flex flex-col items-center gap-10 pt-[clamp(52px,9vw,88px)] pb-[100px]">
      <Script size={30} tilt={0} className="text-brand-espresso">
        ikuti dapur Mami di @instagram
      </Script>
      <div className="flex w-full max-w-full flex-wrap justify-center gap-5">
        {IG.map(([src, alt, tilt]) => (
          <div key={src} className="w-[min(190px,calc(50%-10px))] bg-white px-2.5 pt-2.5 pb-9 shadow-[0_12px_26px_rgb(62_39_35/.15)]" style={{ transform: `rotate(${tilt}deg)` }}>
            <div className="relative aspect-square overflow-hidden bg-brand-butter-100">
              <Image src={src} alt={alt} fill sizes="190px" className="object-cover" />
            </div>
          </div>
        ))}
      </div>
      <InstagramLink className={`${PILL} border-[1.5px] border-brand-espresso text-brand-espresso`}>Ikuti di Instagram</InstagramLink>
    </section>
  );
}
