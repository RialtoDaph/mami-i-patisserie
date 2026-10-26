import { Icon, Script } from "@/components/brand";
import { WaButton } from "../ui";
import Link from "next/link";
import { FaqView } from "./FaqList";

export function FaqPage() {
  return (
    <div data-page="faq">
      <FaqView />
      <section className="px-page bg-brand-butter-50 pb-[clamp(52px,8vw,88px)]">
        <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-5 bg-brand-butter px-[clamp(20px,5vw,48px)] py-[clamp(24px,5vw,40px)]">
          <div className="flex flex-[1_1_300px] flex-col gap-1.5">
            <Script tilt={0}>masih bingung?</Script>
            <span className="font-display text-[clamp(24px,3vw,30px)] leading-[1.15] font-bold">Tanya langsung ke admin</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <WaButton className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-brand-wine px-7 font-bold whitespace-nowrap text-brand-butter transition hover:brightness-[.92]">
              <Icon name="chat" /> Chat WhatsApp
            </WaButton>
            <Link href="/kontak" className="inline-flex min-h-[52px] items-center rounded-full border-[1.5px] border-brand-espresso px-7 font-bold text-brand-espresso">
              Kontak
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
