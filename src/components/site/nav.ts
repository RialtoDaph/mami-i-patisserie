// Website navigation. During the Christmas takeover the campaign page replaces Beranda/Menu/Hampers/Tentang/FAQ.

export interface NavLink {
  href: string;
  label: string;
}

export const NAV_NORMAL: NavLink[] = [
  { href: "/menu", label: "Menu" },
  { href: "/hampers", label: "Hampers" },
  { href: "/#kafe", label: "Kafe" },
  { href: "/tentang", label: "Tentang" },
  { href: "/faq", label: "FAQ" },
  { href: "/kontak", label: "Kontak" },
];

export const NAV_NATAL: NavLink[] = [
  { href: "/#paket", label: "Hampers" },
  { href: "/#cara", label: "Cara pesan" },
  { href: "/#tanya", label: "FAQ" },
  { href: "/kontak", label: "Kontak" },
];

/** Paths that show the Natal page while the campaign is on. */
export const NATAL_TAKEOVER = ["/", "/menu", "/hampers", "/tentang", "/faq"];

export const navFor = (modeNatal: boolean) => (modeNatal ? NAV_NATAL : NAV_NORMAL);
