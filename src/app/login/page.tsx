import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { PinLogin } from "./PinLogin";
import { devicePeople } from "@/lib/teamDevice";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const { next, email } = await searchParams;
  const people = await devicePeople();
  const usePin = people.length > 0 && !email;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-butter-100 px-5 py-8 text-brand-espresso">
      <div className="flex w-full max-w-[380px] flex-col gap-7">
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex items-baseline gap-3 font-display text-[44px] leading-none font-bold whitespace-nowrap">
            <i>Mami</i>
            <span className="text-brand-wine">I</span>
          </span>
          <span className="flex items-center gap-2.5 text-xs font-bold tracking-[.32em] text-brand-pistachio-deep">
            <span className="h-[1.5px] w-7 bg-brand-pistachio-deep" />
            PATISSERIE
            <span className="h-[1.5px] w-7 bg-brand-pistachio-deep" />
          </span>
        </div>
        <div className="flex flex-col gap-4 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 p-6">
          {usePin ? (
            <PinLogin people={people} next={next ?? ""} />
          ) : (
            <>
              <h1 className="font-display text-[22px] font-bold">Masuk</h1>
              <LoginForm next={next ?? ""} />
            </>
          )}
        </div>
        <p className="text-center text-[13px] leading-normal text-brand-muted">
          {usePin ? (
            <>
              Akun &amp; PIN diatur oleh Alto. Lupa PIN? Hubungi Alto.
              <br />
              <Link href={`/login?email=1${next ? `&next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-brand-espresso underline underline-offset-4">
                Masuk dengan email
              </Link>
            </>
          ) : people.length > 0 ? (
            <Link href="/login" className="font-bold text-brand-espresso underline underline-offset-4">Masuk dengan PIN</Link>
          ) : (
            "Akun diatur oleh Alto. Di perangkat yang sudah didaftarkan, tim masuk dengan nama + PIN."
          )}
        </p>
      </div>
    </main>
  );
}
