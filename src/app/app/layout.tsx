import { BottomNav } from "@/components/BottomNav";
import { getCurrentUser } from "@/lib/data";
import { signOut } from "@/lib/actions";
import { ROLE_LABEL } from "@/lib/labels";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  const header = (
    <div className="sticky top-0 z-10 border-b border-black/5 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
        <span className="font-bold text-cocoa">Mami I Pâtisserie</span>
        <form action={signOut} className="flex items-center gap-2">
          <span className="hidden text-sm text-muted sm:inline">
            {user.fullName || user.email}
            {user.role && ` · ${ROLE_LABEL[user.role]}`}
          </span>
          <button type="submit" className="min-h-11 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-crust">
            Keluar
          </button>
        </form>
      </div>
    </div>
  );

  if (!user.role) {
    return (
      <>
        {header}
        <main className="mx-auto max-w-md px-4 py-10">
          <div className="card text-center">
            <h1 className="text-xl font-bold text-cocoa">Akun belum diberi akses</h1>
            <p className="mt-2 text-muted">
              Akun <b>{user.email}</b> sudah terdaftar, tapi belum punya peran. Minta Alto untuk
              mengatur peran Anda.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {header}
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
