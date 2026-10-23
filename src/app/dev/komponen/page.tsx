import { notFound } from "next/navigation";
import {
  AppCard,
  ArchFrame,
  Awning,
  Button,
  ButtonLink,
  Chip,
  DottedPrice,
  Eyebrow,
  Field,
  Icon,
  IconButton,
  Input,
  Logo,
  MiniAwning,
  Photo,
  Polaroid,
  PostCard,
  Script,
  SectionHead,
  Select,
  Sticker,
  StripeDivider,
  Tag,
  Textarea,
} from "@/components/brand";
import { ICON_PATHS, type IconName } from "@/components/brand/icons.generated";

// Developer reference sheet for the brand tokens and base components. Not available in production.
export const metadata = { title: "Komponen", robots: { index: false } };

const SWATCHES: { name: string; token: string; text: string; note: string }[] = [
  { name: "Butter", token: "bg-brand-butter", text: "text-brand-espresso", note: "#f5e8aa · ±60%" },
  { name: "Butter 50", token: "bg-brand-butter-50", text: "text-brand-espresso", note: "#fcf8e6 · latar" },
  { name: "Butter 100", token: "bg-brand-butter-100", text: "text-brand-espresso", note: "#faf2d0 · selang-seling" },
  { name: "Espresso", token: "bg-brand-espresso", text: "text-brand-butter", note: "#3e2723 · ±25%" },
  { name: "Espresso deep", token: "bg-brand-espresso-deep", text: "text-brand-butter", note: "#2a1a17 · bayangan" },
  { name: "Muted", token: "bg-brand-muted", text: "text-brand-butter-50", note: "#685753 · teks sekunder" },
  { name: "Pistachio", token: "bg-brand-pistachio", text: "text-brand-espresso", note: "#a2a672 · ±10% · teks espresso" },
  { name: "Pistachio 50", token: "bg-brand-pistachio-50", text: "text-brand-espresso", note: "#eef0dc · sukses" },
  { name: "Wine", token: "bg-brand-wine", text: "text-brand-butter", note: "#aa1945 · ±5% · CTA saja" },
  { name: "Wine 50", token: "bg-brand-wine-50", text: "text-brand-espresso", note: "#f3dfe5 · nav aktif" },
  { name: "Natal", token: "bg-brand-natal", text: "text-brand-butter", note: "#2d4a3a · kampanye Natal" },
  { name: "Oak", token: "bg-brand-oak", text: "text-brand-butter-50", note: "#9c6b3f · fasad Etalase" },
];

function Block({ title, children, tone = "light" }: { title: string; children: React.ReactNode; tone?: "light" | "alt" | "dark" | "natal" }) {
  const bg = { light: "bg-brand-butter-50", alt: "bg-brand-butter-100", dark: "bg-brand-espresso text-brand-butter", natal: "bg-brand-natal text-brand-butter-50" }[tone];
  return (
    <section className={`px-page py-12 ${bg}`}>
      <h2 className="mb-6 text-xs font-bold tracking-[.2em] uppercase opacity-70">{title}</h2>
      {children}
    </section>
  );
}

export default function KomponenPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh overflow-x-clip bg-brand-butter-50 text-brand-espresso">
      <Awning />
      <Block title="Logo">
        <div className="flex flex-wrap items-center gap-8">
          <div className="rounded-md bg-brand-espresso px-8 py-4 shadow-sign">
            <Logo />
          </div>
          <Logo size="sm" tone="espresso" />
        </div>
      </Block>

      <Block title="Warna (4 brand + turunan, hijau Natal khusus kampanye)" tone="alt">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
          {SWATCHES.map((s) => (
            <div key={s.name} className={`flex min-h-24 flex-col justify-end rounded-md p-3 ${s.token} ${s.text} border border-line`}>
              <span className="font-bold">{s.name}</span>
              <span className="text-xs">{s.note}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Tipografi">
        <div className="flex max-w-3xl flex-col gap-5">
          <Script>freshly baked daily</Script>
          <h1 className="font-display text-[clamp(40px,6.5vw,68px)] leading-[1.02] font-bold text-balance">
            Where Mami&apos;s Recipes <em className="font-normal text-brand-wine">Meet Modern Pastry.</em>
          </h1>
          <h2 className="font-display text-[clamp(30px,4.5vw,44px)] leading-[1.05] font-bold">Mami I Pâtisserie</h2>
          <h3 className="font-display text-[22px] font-bold">Natal Classic · kartu 19–24px</h3>
          <p className="max-w-[560px] text-lg leading-relaxed text-brand-muted">
            Resep keluarga Mami selama 24 tahun, dipadukan teknik pâtisserie modern. Dibuat segar setiap hari di Bandung. (Instrument Sans 18px)
          </p>
          <p className="text-[15px]">Teks UI 15px · <b>tebal 700</b> · <span className="font-semibold">600</span> · <span className="font-medium">500</span></p>
          <Eyebrow>Hampers kue kering</Eyebrow>
          <Eyebrow className="text-brand-natal">2 toples</Eyebrow>
        </div>
      </Block>

      <Block title="Judul section" tone="alt">
        <div className="flex flex-col gap-10">
          <SectionHead script="dari oven Mami" title="Freshly Baked Daily Pastry" aside={<span className="inline-flex items-center gap-1.5"><Icon name="local_shipping" size={18} /> Bandung · kirim instan / ambil</span>} />
          <SectionHead script="dari buku resep Mami" title="Freshly Baked Daily Pastry" center />
        </div>
      </Block>

      <Block title="Tombol web (pill, min 52px)">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Lihat Menu</Button>
          <Button variant="outline">Chat WhatsApp</Button>
          <Button variant="wine" size="md" icon="add">Keranjang</Button>
          <Button variant="espresso" size="sm" icon="shopping_bag">2</Button>
          <Button disabled>Nonaktif</Button>
          <IconButton icon="menu" label="Buka menu" />
          <IconButton icon="shopping_bag" label="Buka keranjang" tone="wine" badge={2} />
        </div>
      </Block>

      <Block title="Tombol di latar gelap" tone="natal">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="butter" className="text-brand-natal">Pilih paket</Button>
          <Button variant="outline-light">Cara pesan</Button>
          <IconButton icon="close" label="Tutup" tone="outline-light" />
        </div>
      </Block>

      <Block title="Tombol app (rect, radius 6px)" tone="alt">
        <div className="flex flex-wrap items-center gap-3">
          <Button shape="rect" icon="add">Order</Button>
          <Button shape="rect" variant="olive" icon="check">Setujui</Button>
          <Button shape="rect" variant="outline" className="border-brand-wine text-brand-wine">Tolak</Button>
          <Button shape="rect" variant="espresso" size="lg" icon="login">Absen masuk</Button>
          <ButtonLink href="/" shape="rect" variant="ghost" size="sm" icon="arrow_back">Kembali</ButtonLink>
        </div>
      </Block>

      <Block title="Chip & tag">
        <div className="flex flex-col gap-5">
          <div className="scroll-x-hidden -mx-1 flex gap-2.5 px-1">
            <Chip active count={10}>Semua</Chip>
            <Chip count={4}>Pastry</Chip>
            <Chip count={2}>Frozen</Chip>
            <Chip count={2}>Hampers</Chip>
            <Chip count={6}>Di kafe</Chip>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag tone="wine">Signature</Tag>
            <Tag>4× Croissant &amp; Cheese Danish</Tag>
            <Tag tone="pistachio">DP diterima</Tag>
            <Tag tone="espresso">Menunggu DP</Tag>
            <Tag tone="butter">Baru</Tag>
            <Tag tone="natal">Natal</Tag>
          </div>
        </div>
      </Block>

      <Block title="Form web (52px, radius 10px) & app (48px, radius 6px)" tone="alt">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-8">
          <div className="flex flex-col gap-4">
            <Field label="Nama penerima" hint="(opsional)">
              <Input placeholder="mis. Keluarga Bapak Hadi" />
            </Field>
            <Field label="Pesan" hint="50/180">
              <Textarea defaultValue="Selamat Natal! Semoga hangat dan manis di rumahmu." maxLength={180} />
            </Field>
            <Field label="No HP" error="Nomor belum lengkap.">
              <Input inputMode="tel" aria-invalid defaultValue="0812" />
            </Field>
          </div>
          <div className="flex flex-col gap-4">
            <Field tone="app" label="Pelanggan">
              <Input tone="app" placeholder="Cari nama atau No WA" />
            </Field>
            <Field tone="app" label="Metode">
              <Select tone="app" defaultValue="ambil">
                <option value="ambil">Ambil sendiri</option>
                <option value="instan">Kirim instan</option>
                <option value="ekspedisi">Ekspedisi</option>
              </Select>
            </Field>
            <p className="rounded-md border-[1.5px] border-brand-pistachio bg-brand-pistachio-50 p-3 text-sm font-semibold">Tercatat</p>
            <p className="text-sm font-semibold text-brand-wine">Error: teks wine</p>
          </div>
        </div>
      </Block>

      <Block title="Kartu web (kartu pos) & papan harga">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-6">
          {[
            { name: "Mami's Classic Croissant", desc: "Croissant butter klasik, dipanggang setiap pagi.", src: "/images/croissant.jpg", price: null },
            { name: "Pistachio & Almond Croissant", desc: "Croissant isi pistachio cream & almond.", src: "/images/pistachio-croissant.jpg", price: 38000 },
            { name: "Kouign-amann", desc: "Foto belum ada.", src: null, price: null },
          ].map((p) => (
            <PostCard key={p.name} lift className="flex flex-col gap-3 p-3">
              <Photo src={p.src} alt={p.name} placeholder="foto kouign-amann, 3/4 angle" sizes="(max-width: 700px) 100vw, 25vw" />
              <div className="flex flex-1 flex-col gap-1 px-1">
                <h3 className="font-display text-[19px] leading-tight font-bold">{p.name}</h3>
                <p className="text-sm leading-normal text-brand-muted">{p.desc}</p>
              </div>
              <DottedPrice price={p.price} className="px-1" />
              <Button size="md" icon="add" block>Keranjang</Button>
            </PostCard>
          ))}
        </div>
        <div className="mt-10 max-w-xl border-4 border-double border-brand-wine bg-brand-butter-50 p-6">
          <DottedPrice name="Pistachio Cream Cold Brew" nameClassName="font-display text-[21px] font-bold" price={null} />
          <DottedPrice name="Café au lait" price={28000} className="mt-3" />
        </div>
      </Block>

      <Block title="Polaroid, bingkai lengkung, stiker" tone="alt">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] items-center gap-12">
          <Polaroid tilt={2.5} caption="Merry Christmas" paper="butter" shadow="deep">
            <Photo src="/images/hampers-kue-kering.jpg" alt="Hampers kue kering dalam box wine" position="58% 50%" />
          </Polaroid>
          <Polaroid tilt={-5} caption="buku resep Mami">
            <Photo src="/images/buku-resep.jpg" alt="Buku resep Mami" ratio="1/1" />
          </Polaroid>
          <div className="relative mx-auto w-full max-w-[340px]">
            <ArchFrame className="aspect-[4/5]">
              <Photo src="/images/pastry-island.jpg" alt="Etalase pastry" ratio="4/5" className="h-full" />
            </ArchFrame>
            <Sticker big="24" small="tahun resep" className="absolute -top-4 -right-4" />
          </div>
        </div>
      </Block>

      <Block title="Kanopi & strip">
        <div className="-mx-[max(clamp(20px,5vw,48px),calc(50vw-592px))] flex flex-col gap-8">
          <div className="bg-brand-butter pt-2">
            <Awning slope />
          </div>
          <div className="bg-brand-espresso">
            <MiniAwning />
            <div className="h-10" />
          </div>
          <StripeDivider />
          <StripeDivider height={14} />
        </div>
      </Block>

      <Block title="Kartu app" tone="alt">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          <AppCard title="Untuk keputusanmu" action={<Tag tone="wine">2</Tag>}>
            <ul className="divide-y divide-line text-[15px]">
              <li className="flex min-h-11 items-center justify-between gap-3">Oven deck baru <b className="tabular-nums">Rp 18.500.000</b></li>
              <li className="flex min-h-11 items-center justify-between gap-3">Campaign Lebaran <b className="tabular-nums">Rp 2.400.000</b></li>
            </ul>
          </AppCard>
          <AppCard title="Order aktif">
            <p className="font-display text-[28px] font-bold tabular-nums">12</p>
            <p className="text-sm text-brand-muted">3 menunggu DP</p>
          </AppCard>
        </div>
      </Block>

      <Block title={`Ikon (Material Symbols Rounded, ${Object.keys(ICON_PATHS).length})`}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
          {(Object.keys(ICON_PATHS) as IconName[]).map((n) => (
            <div key={n} className="flex flex-col items-center gap-1 rounded-md border border-line p-2 text-center">
              <Icon name={n} size={24} />
              <span className="text-[11px] break-all text-brand-muted">{n}</span>
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}
