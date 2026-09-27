import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Share image for WhatsApp / Instagram / social links. Uses the brand tokens (placeholder colors).
export const alt = "Mami I Pâtisserie — Kue & pastry rumahan di Bandung";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const serif = await readFile(
    // EB Garamond: Cormorant's composite accent glyphs render misplaced in the OG renderer.
    join(process.cwd(), "node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-600-normal.woff"),
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f4e3a1" }}>
        <div style={{ display: "flex", height: 28 }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} style={{ flex: 1, background: i % 2 ? "#fbf6ea" : "#6e1f31" }} />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 90px" }}>
          <div style={{ fontSize: 30, color: "#7a5334", letterSpacing: 6 }}>BANDUNG</div>
          <div style={{ fontFamily: "Garamond", fontSize: 112, color: "#4e3321", lineHeight: 1.05 }}>Mami I Pâtisserie</div>
          <div style={{ fontSize: 38, color: "#7a5334", marginTop: 20 }}>Resep warisan Mami, 24 tahun · Pesan via WhatsApp</div>
        </div>
        <div style={{ display: "flex", height: 70, background: "#93a86e", alignItems: "center", padding: "0 90px", color: "#fbf6ea", fontSize: 30 }}>
          Kue kering · Frozen · Kue basah · Hampers
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Garamond", data: serif, style: "normal", weight: 600 }] },
  );
}
