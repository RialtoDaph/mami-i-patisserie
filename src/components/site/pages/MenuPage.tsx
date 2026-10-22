import Image from "next/image";
import { Icon, Script } from "@/components/brand";
import { CAFE_FEATURED, CAFE_MENU, DRINKS, HAMPERS_BOXES, productById, productsIn } from "@/content/catalog";
import { waLink } from "@/lib/site/wa";
import { AddButton, AutoVideo } from "../bits";
import { Breadcrumb, WaButton } from "../ui";
import { MenuFilter } from "./MenuFilter";

const H2 = "font-display text-[clamp(30px,7.5vw,44px)] leading-none font-bold";
const SECTION = "px-page flex scroll-mt-[140px] flex-col gap-8 py-[clamp(52px,9vw,72px)]";
const HARGA = <span className="font-script text-[17px] text-brand-muted">harga menyusul</span>;

function Head({ script, title, aside, light }: { script: string; title: string; aside: React.ReactNode; light?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex flex-col gap-1.5">
        <Script tilt={0} className={light ? "text-brand-butter" : "text-brand-wine"}>
          {script}
        </Script>
        <h2 className={H2}>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

export function MenuPage() {
  const pastry = (
    <section id="pastry" className={SECTION}>
      <Head
        script="dari oven Mami"
        title="Freshly Baked Daily Pastry"
        aside={
          <span className="flex items-center gap-1.5 text-sm text-brand-muted">
            <Icon name="local_shipping" size={18} /> Bandung · kirim instan / ambil
          </span>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(max(150px,calc((100%-72px)/4)),1fr))] gap-[clamp(14px,2.5vw,24px)]">
        {productsIn("pastry").map((p) => (
          <article key={p.id} className="group flex flex-col gap-3 bg-white px-3 pt-3 pb-4 shadow-postcard transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgb(62_39_35/.18)]">
            <div className="relative aspect-[4/5] overflow-hidden bg-brand-butter-100">
              <Image src={p.img!} alt={p.name} fill sizes="(max-width: 760px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 px-1">
              <span className="font-display text-[19px] leading-[1.2] font-bold">{p.name}</span>
              <span className="text-sm leading-normal text-brand-muted">{p.desc}</span>
            </div>
            <div className="flex items-baseline gap-2 px-1">
              <span aria-hidden className="flex-1 -translate-y-1 border-b-2 border-dotted border-brand-espresso/35" />
              {HARGA}
            </div>
            <AddButton productId={p.id} block />
          </article>
        ))}
      </div>
    </section>
  );

  const frozen = (
    <section id="frozen" className={`${SECTION} bg-brand-butter-100`}>
      <Head
        script="stok di freezer"
        title="Frozen · Risol & Kroket"
        aside={
          <span className="flex items-center gap-1.5 text-sm text-brand-muted">
            <Icon name="ac_unit" size={18} className="text-brand-wine" /> Beku, tinggal goreng · simpan di freezer
          </span>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6">
        {productsIn("frozen").map((p) => (
          <article key={p.id} className="group grid grid-cols-[minmax(96px,130px)_minmax(0,1fr)] gap-5 bg-brand-butter-50 p-3.5 shadow-[0_2px_0_rgb(62_39_35/.08),0_14px_30px_rgb(62_39_35/.08)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgb(62_39_35/.18)]">
            <div className="relative aspect-square overflow-hidden bg-brand-butter-100">
              <Image src={p.img!} alt={p.name} fill sizes="130px" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="font-display text-[22px] leading-[1.15] font-bold">{p.name}</span>
              <span className="text-sm leading-normal text-brand-muted">{p.desc}</span>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5">
                {HARGA}
                <AddButton productId={p.id} size="sm" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const sig = productById("signature-recipe")!;
  const box = productById("blessings-box")!;
  const boxItems = HAMPERS_BOXES[0].items;
  const hampers = (
    <section id="hampers" className={`${SECTION} bg-brand-wine text-brand-butter`}>
      <Head script="untuk hadiah" title="Hampers" light aside={<span className="text-[15px] text-brand-butter-50">Preorder Lebaran 2027 · 15 Jan – 3 Mar</span>} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6">
        <article className="group flex flex-col gap-4 bg-brand-butter-50 p-4 text-brand-espresso transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgb(62_39_35/.18)]">
          <div className="relative aspect-[16/10] overflow-hidden bg-brand-butter-100">
            <Image src={sig.img!} alt="Box hampers kue kering" fill sizes="(max-width: 760px) 90vw, 580px" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
          </div>
          <div className="flex flex-1 flex-col gap-2 px-2">
            <span className="text-xs font-bold tracking-[.2em] text-brand-wine uppercase">Hampers kue kering</span>
            <span className="font-display text-[30px] leading-[1.1] font-bold">{sig.name}</span>
            <span className="text-base leading-[1.55] text-brand-muted">{sig.desc}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-2 pb-2">
            <span className="font-script text-lg text-brand-muted">harga menyusul</span>
            <AddButton productId={sig.id} />
          </div>
        </article>
        <article className="group flex flex-col gap-4 bg-brand-butter-50 p-4 text-brand-espresso transition-[transform,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgb(62_39_35/.18)]">
          <div className="relative aspect-[16/10] overflow-hidden bg-brand-butter-100">
            <Image src={box.img!} alt="Blessings Box + kartu ucapan" fill sizes="(max-width: 760px) 90vw, 580px" className="object-cover" />
            <AutoVideo src="/video/blessings-box.mp4" poster={box.img!} className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="flex flex-1 flex-col gap-2 px-2">
            <span className="text-xs font-bold tracking-[.2em] text-brand-wine uppercase">Paket silaturahmi calon mertua</span>
            <span className="font-display text-[30px] leading-[1.1] font-bold">{box.name}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {boxItems.map(([q, n]) => (
                <span key={n} className="rounded-full border border-brand-espresso/20 px-3 py-[5px] text-[13px] whitespace-nowrap">
                  {q}× {n}
                </span>
              ))}
            </div>
            <span className="mt-1.5 font-script text-lg leading-[1.35]">+ kartu ucapan: “Bawa martabak sudah biasa…”</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-2 pb-2">
            <span className="font-script text-lg text-brand-muted">harga menyusul</span>
            <AddButton productId={box.id} />
          </div>
        </article>
      </div>
    </section>
  );

  const kafe = (
    <section id="kafe" className={`${SECTION} gap-9 bg-brand-butter`}>
      <Head
        script="hanya di kafe"
        title="Menu kafe · Oktober 2027"
        aside={
          <span className="flex flex-none items-center gap-2 rounded-full bg-brand-butter-50 px-4 py-2.5 text-sm font-semibold whitespace-nowrap">
            <Icon name="info" size={18} className="text-brand-wine" /> Dine-in · harga contoh, belum final
          </span>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-12">
        <div id="kafe-card" data-tilt="board" className="bg-brand-butter-50 p-3.5 shadow-[0_24px_48px_rgb(62_39_35/.18),0_2px_0_rgb(62_39_35/.08)] will-change-transform">
          <div className="flex flex-col gap-7 border-2 border-brand-wine px-[clamp(20px,5vw,40px)] pt-10 pb-8 outline outline-1 -outline-offset-8 outline-brand-wine/40">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="font-display text-[34px] leading-none italic">
                Mami <b className="text-brand-wine not-italic">I</b>
              </span>
              <span className="flex items-center gap-2.5 text-[10px] font-semibold tracking-[.5em]">
                <span className="h-px w-5 bg-brand-espresso" />
                <span className="-mr-[.5em]">PATISSERIE</span>
                <span className="h-px w-5 bg-brand-espresso" />
              </span>
              <span className="mt-2.5 font-script text-2xl text-brand-wine">la carte du café</span>
            </div>
            {CAFE_MENU.map((g) => (
              <div key={g.title} className="flex flex-col gap-2.5">
                <div className="flex flex-col items-center gap-0.5 border-b border-brand-espresso/20 pb-2.5 text-center">
                  <span className="font-display text-base font-bold tracking-[.14em] text-balance uppercase">{g.title}</span>
                  <span className="font-display text-sm text-brand-muted italic">{g.fr}</span>
                </div>
                {g.items.map((it) => (
                  <div key={it.name} className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-semibold">{it.name}</span>
                      <span aria-hidden className="min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-brand-espresso/30" />
                      <span className="min-w-8 text-right font-display text-[15px] font-bold whitespace-nowrap tabular-nums">{it.price}</span>
                    </div>
                    {it.desc && <span className="text-[13px] text-brand-muted italic">{it.desc}</span>}
                  </div>
                ))}
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-brand-espresso/20 pt-3.5 text-xs text-brand-muted">
              <span>Harga dalam ribu rupiah · contoh</span>
              <span className="font-script text-lg text-brand-wine">merci!</span>
            </div>
          </div>
        </div>
        <div
          className="sticky top-[150px] flex flex-col gap-[18px] bg-brand-pistachio p-7"
          style={{
            backgroundImage: "linear-gradient(90deg, rgb(252 248 230 / .55) 2px, transparent 2px), linear-gradient(0deg, rgb(252 248 230 / .55) 2px, transparent 2px)",
            backgroundSize: "56px 56px",
          }}
        >
          <span className="self-start bg-brand-butter-50 px-3.5 py-1.5 font-script text-2xl">andalan Mami</span>
          {CAFE_FEATURED.map((f) => {
            const inner = (
              <>
                <div className="relative aspect-square overflow-hidden bg-brand-butter-100">
                  <Image src={f.img} alt={f.name} fill sizes="120px" className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 pr-1.5">
                  <span className="self-start rounded-full bg-brand-wine px-2.5 py-1 text-[11px] font-bold tracking-[.14em] text-brand-butter uppercase">{f.tag}</span>
                  <span className="font-display text-lg leading-[1.2] font-bold">{f.name}</span>
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-script text-xl whitespace-nowrap text-brand-wine">{f.price}</span>
                    {waLink() && (
                      <span className="flex items-center gap-1 text-[13px] font-bold text-brand-muted">
                        <Icon name="chat" size={16} /> Tanya
                      </span>
                    )}
                  </span>
                </div>
              </>
            );
            const cls = "grid grid-cols-[clamp(88px,22vw,120px)_minmax(0,1fr)] items-center gap-4 bg-brand-butter-50 p-2.5 text-brand-espresso shadow-[0_10px_24px_rgb(62_39_35/.18)]";
            const href = waLink(f.ask);
            return href ? (
              <a key={f.name} href={href} target="_blank" rel="noopener noreferrer" className={`${cls} transition-transform duration-200 hover:-translate-y-1`}>
                {inner}
              </a>
            ) : (
              <div key={f.name} className={cls}>
                {inner}
              </div>
            );
          })}
          <WaButton
            text="Halo Mami I Patisserie, tolong kabari saya saat kafe buka ya."
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand-wine font-bold text-brand-butter transition hover:brightness-[.92] active:scale-[.97]"
          >
            <Icon name="notifications" /> Kabari saya saat kafe buka
          </WaButton>
        </div>
      </div>
    </section>
  );

  return (
    <div data-page="menu">
      <section className="px-page flex flex-col gap-[18px] bg-brand-butter pt-10 pb-14">
        <Breadcrumb current="Menu" />
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
            <Script tilt={0}>la carte</Script>
            <h1 className="font-display text-[clamp(44px,5vw,64px)] leading-none font-bold">Menu Mami I</h1>
            <p className="max-w-[560px] text-lg leading-[1.6] text-brand-muted">Semua dibuat berdasarkan pesanan (preorder). Harga final dan ongkir dikonfirmasi admin via WhatsApp.</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-full bg-brand-butter-50 px-[18px] py-3 text-sm font-semibold whitespace-nowrap">
            <Icon name="schedule" className="text-brand-wine" /> Pesan online mulai Januari 2027
          </div>
        </div>
      </section>
      <MenuFilter
        sections={[
          { id: "pastry", label: "Pastry", count: productsIn("pastry").length, node: pastry },
          { id: "frozen", label: "Frozen", count: productsIn("frozen").length, node: frozen },
          { id: "hampers", label: "Hampers", count: productsIn("hampers").length, node: hampers },
          { id: "kafe", label: "Di kafe", count: DRINKS.length + 1, node: kafe },
        ]}
      />
      <section className="px-page pb-[88px]">
        <div className="flex flex-wrap items-center justify-between gap-8 bg-brand-butter px-[clamp(20px,5vw,48px)] py-[clamp(24px,5vw,40px)]">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
            <span className="font-display text-[28px] font-bold">Cari yang tidak ada di menu?</span>
            <span className="text-base text-brand-muted">Tanyakan pesanan custom atau hampers khusus langsung ke admin.</span>
          </div>
          <WaButton
            text="Halo Mami I Patisserie, saya mau tanya menu."
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-brand-espresso px-7 font-bold whitespace-nowrap text-brand-butter active:scale-[.97]"
          >
            <Icon name="chat" /> Tanya via WhatsApp
          </WaButton>
        </div>
      </section>
    </div>
  );
}
