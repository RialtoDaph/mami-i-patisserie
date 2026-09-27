import Link from "next/link";

// Public website placeholder. The full website is a later phase.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Bandung</p>
      <h1 className="text-4xl font-bold text-cocoa">Mami I Pâtisserie</h1>
      <p className="text-lg text-ink/80">
        Hampers kue kering, risol &amp; kroket frozen, kue basah, dan Blessings Box.
        Pesan online mulai Januari 2027. Kafe kami buka Oktober 2027.
      </p>
      <Link href="/login" className="mt-8 text-sm text-muted underline underline-offset-4">
        Masuk tim
      </Link>
    </main>
  );
}
