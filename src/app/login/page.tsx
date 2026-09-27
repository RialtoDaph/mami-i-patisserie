import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-cocoa">Mami I Pâtisserie</h1>
        <p className="mt-1 text-muted">Masuk ke aplikasi tim</p>
      </div>
      <LoginForm next={next ?? ""} />
    </main>
  );
}
