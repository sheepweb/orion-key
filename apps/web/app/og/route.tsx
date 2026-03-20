import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = (searchParams.get("title") || "Orion Key").slice(0, 48)
    const label = (searchParams.get("label") || "数字商品").slice(0, 18)
    const siteName = (searchParams.get("siteName") || "Orion Key").slice(0, 28)

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #111827 0%, #1d4ed8 100%)",
            color: "#ffffff",
            padding: "72px",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "flex-start",
              borderRadius: "999px",
              padding: "12px 24px",
              background: "rgba(255,255,255,0.12)",
              fontSize: 28,
            }}
          >
            {label}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 68, lineHeight: 1.2, fontWeight: 700 }}>{title}</div>
            <div style={{ fontSize: 30, color: "rgba(255,255,255,0.84)" }}>
              数字商品自动发货 · 购买指南 · 帮助内容
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "rgba(255,255,255,0.82)" }}>
            <div>{siteName}</div>
            <div>OG Image</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch {
    return new Response("Failed to generate OG image", { status: 500 })
  }
}

