import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { company } from "@/lib/site-data";

export const alt = `${company.brand} cable-management and structural-support manufacturing`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoData = await readFile(join(process.cwd(), "public", "assets", "brand", "logo.png"), "base64");
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #edf7ff 0%, #ffffff 58%, #d8f5ff 100%)",
          color: "#10233f",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "76px 84px",
          position: "relative",
          width: "100%",
        }}
      >
        <div style={{ background: "#00aee8", height: "10px", left: 0, position: "absolute", top: 0, width: "100%" }} />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "820px" }}>
          <div style={{ color: "#0878d1", display: "flex", fontSize: 27, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Cable management · Structural support
          </div>
          <div style={{ color: "#25358f", display: "flex", fontSize: 66, fontWeight: 800, lineHeight: 1.08, marginTop: "24px" }}>
            Project-ready manufacturing starts with confirmed requirements.
          </div>
          <div style={{ display: "flex", fontSize: 28, marginTop: "32px" }}>{company.publicName}</div>
        </div>
        <div style={{ alignItems: "center", background: "#ffffff", border: "2px solid #c7e9fb", borderRadius: "34px", display: "flex", height: "230px", justifyContent: "center", padding: "34px", width: "250px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={logoSrc} style={{ height: 154, objectFit: "contain", width: 172 }} />
        </div>
      </div>
    ),
    size,
  );
}
