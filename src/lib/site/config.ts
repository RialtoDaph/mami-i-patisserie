// Website settings. Stage 4 reads these from the `settings` table (owner/admin edit them in the app);
// until then they come from env with the defaults chosen by Alto in the design handoff.

export type SnowMode = "hero" | "semua" | "mati";

export interface SiteConfig {
  /** Christmas takeover: /, /menu, /hampers, /tentang and /faq show the Natal campaign page. */
  modeNatal: boolean;
  snow: SnowMode;
  dpPercent: number;
  dpRound: number;
  minLeadDays: number;
  natalQuota: number;
  /** Boxes already taken by active orders (stage 4: computed from orders). */
  natalUsed: number;
}

const SNOW: SnowMode[] = ["hero", "semua", "mati"];

export function getSiteConfig(): SiteConfig {
  const snow = process.env.NEXT_PUBLIC_SNOW as SnowMode | undefined;
  return {
    modeNatal: process.env.NEXT_PUBLIC_MODE_NATAL !== "0",
    snow: snow && SNOW.includes(snow) ? snow : "semua",
    dpPercent: 40,
    dpRound: 50_000,
    minLeadDays: 2,
    natalQuota: 100,
    natalUsed: 0,
  };
}
