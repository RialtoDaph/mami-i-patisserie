import Image from "next/image";
import Link from "next/link";
import { ButtonLink, Icon, Script } from "@/components/brand";
import { daysUntil, LEBARAN_2027 } from "@/content/campaigns";
import { AutoVideo } from "../bits";
import { Breadcrumb, WaButton } from "../ui";
import { HampersBuilder } from "./HampersBuilder";

const H2 = "font-display text-[clamp(30px,5vw,44px)] leading-[1.08] font-bold text-balance";
const BAND: Record<string, string> = { wine: "bg-brand-wine", espresso: "bg-brand-espresso", "pistachio-deep": "bg-brand-pistachio-deep" };

const FAQ = [
  ["Kapan hampers dikirim?", "Hampers Lebaran dikirim atau bisa diambil 5–8 Maret 2027. Di luar musim Lebaran, minimal pesan 2 hari sebelumnya."],
  ["Bisa kirim ke luar kota?", "Kue kering bisa dikirim lewat ekspedisi. Blessings Box berisi pastry segar, jadi hanya untuk Bandung dan sekitarnya."],
  ["Kartu ucapannya ditulis tangan?", "Ya. Pesan yang kamu tulis akan ditulis ulang dengan tangan di kartu."],
];

export function HampersPage() {
  const days = daysUntil(LEBARAN_2027.openAt);
  return (
    <div data-page="hampers">
      <section className="px-page overflow-hidden bg-brand-wine pt-8 pb-[clamp(56px,8vw,96px)] text-brand-butter">
        <Breadcrumb current="Hampers" light />
        <div className="mt-[clamp(20px,4vw,40px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-center gap-[clamp(40px,6vw,72px)]">
          <div className="flex flex-col gap-[22px]">
            <Script tilt={0} className="text-brand-butter">
              hampers dari dapur Mami
            </Script>
            <h1 className="font-display text-[clamp(40px,6.5vw,68px)] leading-[1.02] font-bold text-balance">
              Kirim bingkisan, <em className="font-normal">bukan sekadar kue.</em>
            </h1>
            <p className="max-w-[500px] text-lg leading-[1.6] text-pretty text-brand-butter-50">
              Pilih isinya, tulis kartu ucapan, dan Mami yang menuliskannya dengan tangan. Dikemas dalam box wine berpita, siap diantar ke orang tersayang.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="#rangkai" variant="butter" className="text-brand-wine">
                Rangkai bingkisan <Icon name="arrow_downward" />
              </ButtonLink>
              <ButtonLink href="#lebaran" variant="outline-light" className="border-brand-butter">
                Jadwal Lebaran
              </ButtonLink>
            </div>
          </div>
          <div className="relative w-[min(100%,460px)] justify-self-center pb-10 pl-6">
            <div className="relative rotate-[2.5deg] bg-brand-butter-50 px-3 pt-3 pb-12 shadow-[0_24px_48px_rgb(42_26_23/.35)]">
              <div className="relative aspect-[4/5] overflow-hidden bg-brand-butter-100">
                <Image src="/images/hampers-kue-kering.jpg" alt="Hampers kue kering Mami dalam box wine" fill priority sizes="(max-width: 760px) 90vw, 460px" className="object-cover" />
                <AutoVideo src="/video/blessings-box.mp4" poster="/images/hampers-kue-kering.jpg" className="absolute inset-0 size-full object-cover" />
                <span className="absolute top-2.5 right-2.5 rounded bg-brand-espresso/75 px-2 py-1.5 font-mono text-[11px] leading-none text-brand-butter">contoh · dibuat AI</span>
              </div>
              <span className="absolute bottom-3.5 left-4 font-script text-[21px] text-brand-espresso">dibuka dengan senyum</span>
            </div>
            <div className="absolute bottom-0 left-0 flex origin-top-left -rotate-[7deg] items-center drop-shadow-[0_12px_18px_rgb(42_26_23/.3)]">
              <span className="h-0.5 w-11 bg-brand-butter" />
              <div className="relative flex min-w-[190px] flex-col gap-0.5 bg-brand-butter py-3.5 pr-[22px] pl-[34px] text-brand-espresso [clip-path:polygon(18px_0,100%_0,100%_100%,18px_100%,0_50%)]">
                <span className="absolute top-1/2 left-4 -mt-[5px] size-2.5 rounded-full bg-brand-wine" />
                <span className="text-[11px] font-bold tracking-[.16em] text-brand-wine uppercase">pre-order Lebaran</span>
                <span className="font-display text-[26px] leading-[1.1] font-bold">{days} hari lagi</span>
                <span className="text-[13px] text-brand-muted">dibuka 15 Januari 2027</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="rangkai" className="px-page flex scroll-mt-[72px] flex-col gap-[clamp(28px,4vw,44px)] bg-brand-butter-50 py-[clamp(52px,8vw,88px)]">
        <div className="flex flex-col gap-1.5">
          <Script tilt={0}>rangkai bingkisanmu</Script>
          <h2 className={H2}>Tiga langkah, satu bingkisan</h2>
        </div>
        <HampersBuilder />
      </section>

      <section id="lebaran" className="px-page flex scroll-mt-[72px] flex-col gap-[clamp(28px,4vw,40px)] bg-brand-butter py-[clamp(52px,8vw,88px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex flex-[1_1_320px] flex-col gap-1.5">
            <Script tilt={0}>pre-order Lebaran 2027</Script>
            <h2 className={H2}>Tandai kalendernya</h2>
          </div>
          <span className="text-base font-semibold">Kuota {LEBARAN_2027.quota} box · DP 40% mengunci pesanan</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-[clamp(14px,2.5vw,24px)]">
          {LEBARAN_2027.timeline.map((s) => (
            <div key={s.title} className="flex flex-col bg-white shadow-[0_10px_24px_rgb(62_39_35/.1)]" style={{ transform: `rotate(${s.tilt}deg)` }}>
              <div className={`flex items-center justify-between px-4 py-2.5 text-brand-butter ${BAND[s.band]}`}>
                <span className="text-[13px] font-bold tracking-[.18em]">{s.month}</span>
                <span className="flex gap-2.5">
                  <span className="size-2 rounded-full bg-brand-butter" />
                  <span className="size-2 rounded-full bg-brand-butter" />
                </span>
              </div>
              <div className="flex flex-col gap-1.5 px-[18px] pt-[18px] pb-[22px]">
                <span className="font-display text-[clamp(40px,6vw,54px)] leading-none font-bold">{s.day}</span>
                <span className="font-display text-[19px] font-bold">{s.title}</span>
                <span className="text-[15px] leading-normal text-brand-muted">{s.text}</span>
              </div>
            </div>
          ))}
        </div>
        <WaButton
          text="Halo Mami I Patisserie, tolong ingatkan saya saat pre-order hampers Lebaran 2027 dibuka ya."
          className="inline-flex min-h-[52px] items-center gap-2 self-start rounded-full bg-brand-wine px-7 font-bold whitespace-nowrap text-brand-butter transition hover:brightness-[.92] active:scale-[.97]"
        >
          <Icon name="notifications" /> Ingatkan saya saat dibuka
        </WaButton>
      </section>

      <section className="px-page flex flex-wrap items-center justify-between gap-6 bg-brand-espresso py-[clamp(44px,7vw,72px)] text-brand-butter">
        <div className="flex flex-[1_1_380px] flex-col gap-2">
          <Script tilt={0} className="text-brand-pistachio">
            untuk kantor &amp; acara
          </Script>
          <h2 className={H2}>Pesan lebih dari 20 box?</h2>
          <p className="max-w-[560px] text-lg leading-[1.6] text-pretty text-brand-butter-100">
            Kartu dengan logo, pita warna perusahaan, dan pengiriman ke banyak alamat. Ada harga khusus untuk pesanan besar.
          </p>
        </div>
        <WaButton
          text="Halo Mami I Patisserie, saya mau tanya pesanan hampers dalam jumlah besar (lebih dari 20 box)."
          className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-brand-butter px-7 font-bold whitespace-nowrap text-brand-espresso transition hover:brightness-[.92]"
        >
          <Icon name="chat" /> Diskusi via WhatsApp
        </WaButton>
      </section>

      <section className="px-page flex flex-col gap-[clamp(28px,4vw,40px)] bg-brand-butter-50 py-[clamp(52px,8vw,88px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <h2 className={H2}>Sering ditanya soal hampers</h2>
          <Link href="/faq" className="border-b-[1.5px] border-brand-espresso pb-[3px] font-bold whitespace-nowrap text-brand-espresso">
            Semua FAQ →
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
          {FAQ.map(([q, a]) => (
            <div key={q} className="flex flex-col gap-2 border-t-[1.5px] border-dashed border-brand-espresso/25 pt-[18px]">
              <span className="font-display text-[19px] leading-[1.3] font-bold">{q}</span>
              <span className="text-base leading-[1.6] text-brand-muted">{a}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
