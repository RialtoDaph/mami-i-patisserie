import Image from "next/image";
import { ButtonLink, Icon, Script, Sticker, type IconName } from "@/components/brand";
import { Breadcrumb, Tape, WaButton } from "../ui";
import { IgGallery } from "./HomePage";

const STORY_1 =
  "Selama 24 tahun, resep-resep di dapur Mami hanya dinikmati keluarga dan sahabat: kue kering di setiap hari raya, risol untuk arisan, kue basah untuk sore hari.";
const STORY_2 = "Kini resep warisan itu kami bagikan lebih luas, dengan bahan yang dipilih teliti dan sentuhan pâtisserie ala Paris, tanpa kehilangan rasa rumahnya.";

const COLLAGE = [
  { src: "/images/buku-resep.jpg", alt: "Buku resep Mami", caption: "buku resep Mami", tilt: -5, tape: -3, ratio: "1/1", pos: "left-0 top-[4%] w-[58%]" },
  { src: "/images/kue-kering-raya.jpg", alt: "Kue kering hari raya", caption: "setiap hari raya", tilt: 4, tape: 4, ratio: "1/1", pos: "right-0 top-0 w-[54%]" },
  { src: "/images/risol-arisan.jpg", alt: "Risol untuk arisan", caption: "risol untuk arisan", tilt: -1, tape: -6, ratio: "4/3", pos: "left-[20%] bottom-0 w-[58%]" },
];

const JOURNEY = [
  ["24 tahun", "Dapur keluarga", "Kue kering hari raya, risol arisan, kue basah sore hari — hanya untuk keluarga & sahabat.", "bg-brand-butter", "shadow-[0_0_0_2px_var(--color-brand-butter)]"],
  ["Januari 2027", "Pesan online", "Pastry, kue kering, frozen, dan hampers bisa dipesan via website & WhatsApp.", "bg-brand-wine", "shadow-[0_0_0_2px_var(--color-brand-wine)]"],
  ["Oktober 2027", "Kafe Mami I", "Kafe di Bandung dengan Grand Pastry Island, bar kopi, dan studio kaca.", "bg-brand-pistachio", "shadow-[0_0_0_2px_var(--color-brand-pistachio)]"],
];

const VALUES: [IconName, string, string][] = [
  ["menu_book", "Resep keluarga asli", "Resep yang sama dengan yang Mami buat untuk keluarga selama 24 tahun."],
  ["eco", "Bahan dipilih teliti", "Butter, tepung, dan isian dipilih satu per satu oleh Mami."],
  ["bakery_dining", "Dibuat segar", "Pastry dipanggang setiap hari sesuai pesanan, bukan stok pabrik."],
];

export function TentangPage() {
  return (
    <div data-page="tentang">
      <section className="px-page grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-14 bg-brand-butter pt-10 pb-20">
        <div className="flex flex-col gap-[22px]">
          <Breadcrumb current="Tentang" />
          <Script tilt={0}>cerita kami</Script>
          <h1 className="font-display text-[clamp(44px,5vw,64px)] leading-[1.05] font-bold text-balance">
            24 tahun di dapur Mami, <em className="font-normal text-brand-wine">kini untuk meja Anda.</em>
          </h1>
          <p className="max-w-[500px] text-[19px] leading-[1.6] text-brand-muted">{STORY_1}</p>
        </div>
        <div className="relative w-full max-w-[440px] justify-self-center">
          <div className="overflow-hidden border-[12px] border-brand-espresso" style={{ borderRadius: "220px 220px 6px 6px" }}>
            <div className="relative h-[clamp(340px,90vw,520px)] bg-brand-butter-100">
              <Image src="/images/mami-dapur.jpg" alt="Potret Mami di dapur" fill priority sizes="(max-width: 760px) 90vw, 440px" className="object-cover" />
            </div>
          </div>
          <div className="-mx-[18px] h-3.5 rounded-[3px] bg-brand-espresso" />
          <Sticker big="24" small="tahun resep" tilt={-8} className="absolute bottom-20 -left-10" />
        </div>
      </section>

      <section className="px-page grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[72px] py-[clamp(52px,9vw,96px)]">
        <div className="relative aspect-[1/1.3] w-full">
          {COLLAGE.map((c) => (
            <figure key={c.src} className={`absolute bg-white px-3 pt-3 pb-12 shadow-polaroid ${c.pos}`} style={{ transform: `rotate(${c.tilt}deg)` }}>
              <div className="relative overflow-hidden bg-brand-butter-100" style={{ aspectRatio: c.ratio }}>
                <Image src={c.src} alt={c.alt} fill sizes="(max-width: 760px) 55vw, 340px" className="object-cover" />
              </div>
              <Tape tilt={c.tape} className="-top-3 left-1/2 -ml-12" />
              <figcaption className="absolute bottom-3 left-[18px] font-script text-xl">{c.caption}</figcaption>
            </figure>
          ))}
        </div>
        <div className="flex flex-col gap-[22px]">
          <Script tilt={0}>dari keluarga, untuk keluarga</Script>
          <p className="font-display text-[32px] leading-[1.35] text-pretty italic">“Resep yang dulu hanya untuk keluarga dan sahabat.”</p>
          <p className="text-lg leading-[1.7] text-brand-muted">{STORY_1}</p>
          <p className="text-lg leading-[1.7] text-brand-muted">{STORY_2}</p>
        </div>
      </section>

      <section className="px-page flex flex-col gap-12 bg-brand-espresso py-[clamp(52px,9vw,88px)] text-brand-butter">
        <div className="flex flex-col gap-2">
          <Script tilt={0} className="text-brand-pistachio">
            perjalanan kami
          </Script>
          <h2 className="font-display text-[clamp(30px,7.5vw,46px)] leading-none font-bold">Dari dapur rumah ke kafe</h2>
        </div>
        <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-y-10">
          <div aria-hidden className="absolute top-3 right-0 left-3 hidden border-t-2 border-dotted border-brand-butter/45 min-[780px]:block" />
          {JOURNEY.map(([year, label, text, dot, ring]) => (
            <div key={year} className="relative flex flex-col gap-3 pr-10">
              <span className={`size-[26px] rounded-full border-[3px] border-brand-espresso ${dot} ${ring}`} />
              <span className="mt-2 font-display text-[30px] font-bold">{year}</span>
              <span className="text-[13px] font-bold tracking-[.16em] text-brand-pistachio uppercase">{label}</span>
              <span className="text-base leading-[1.6] text-brand-butter-100">{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-page flex flex-col gap-10 py-[clamp(52px,9vw,96px)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <Script tilt={0}>yang Mami jaga</Script>
          <h2 className="font-display text-[clamp(30px,7.5vw,46px)] leading-none font-bold">Resep rumah, standar pâtisserie</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6">
          {VALUES.map(([icon, t, d]) => (
            <div key={t} className="flex flex-col gap-3.5 bg-white p-8 shadow-[0_2px_0_rgb(62_39_35/.08),0_14px_30px_rgb(62_39_35/.08)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgb(62_39_35/.18)]">
              <span className="flex size-[60px] items-center justify-center rounded-full bg-brand-butter">
                <Icon name={icon} size={30} />
              </span>
              <span className="font-display text-2xl font-bold">{t}</span>
              <span className="text-base leading-[1.6] text-brand-muted">{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-page pb-24">
        <div className="flex flex-wrap items-center justify-between gap-10 bg-brand-wine p-[clamp(28px,6vw,64px)] text-brand-butter">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
            <Script tilt={0} className="text-brand-butter">
              sudah penasaran?
            </Script>
            <h2 className="font-display text-[clamp(30px,7.5vw,44px)] leading-[1.05] font-bold">Cicipi resep Mami</h2>
            <p className="text-lg text-brand-butter-50">Pesan online mulai Januari 2027 · Kafe buka Oktober 2027</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/menu" variant="butter" className="text-brand-wine">
              Lihat Menu
            </ButtonLink>
            <WaButton className="inline-flex min-h-[52px] items-center rounded-full border-[1.5px] border-brand-butter px-7 font-bold whitespace-nowrap text-brand-butter active:scale-[.97]">
              Chat WhatsApp
            </WaButton>
          </div>
        </div>
      </section>
      <IgGallery />
    </div>
  );
}
