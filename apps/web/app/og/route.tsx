import { ImageResponse } from "next/og"

export const runtime = "edge"

const THEMES: Record<string, { background: string; accent: string; subtitle: string; panel: string }> = {
  default: {
    background: "linear-gradient(135deg, #111827 0%, #1d4ed8 100%)",
    accent: "rgba(255,255,255,0.12)",
    subtitle: "数字商品自动发货 · 购买指南 · 帮助内容",
    panel: "rgba(255,255,255,0.08)",
  },
  blog: {
    background: "linear-gradient(135deg, #3b0764 0%, #2563eb 100%)",
    accent: "rgba(255,255,255,0.16)",
    subtitle: "博客公告 · 更新说明 · 选购建议",
    panel: "rgba(255,255,255,0.10)",
  },
  topics: {
    background: "linear-gradient(135deg, #0f172a 0%, #0f766e 100%)",
    accent: "rgba(255,255,255,0.14)",
    subtitle: "专题内容 · 购买指南 · 售后建议",
    panel: "rgba(255,255,255,0.10)",
  },
  help: {
    background: "linear-gradient(135deg, #1f2937 0%, #16a34a 100%)",
    accent: "rgba(255,255,255,0.14)",
    subtitle: "帮助中心 · FAQ · 支付与发货说明",
    panel: "rgba(255,255,255,0.10)",
  },
  "product-tag": {
    background: "linear-gradient(135deg, #111827 0%, #ea580c 100%)",
    accent: "rgba(255,255,255,0.14)",
    subtitle: "商品标签 · 内容聚合 · 继续发现",
    panel: "rgba(255,255,255,0.10)",
  },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = (searchParams.get("title") || "Orion Key").slice(0, 48)
    const label = (searchParams.get("label") || "数字商品").slice(0, 18)
    const siteName = (searchParams.get("siteName") || "Orion Key").slice(0, 28)
    const variant = searchParams.get("variant") || "default"
    const theme = THEMES[variant] || THEMES.default
    const subtitle = (searchParams.get("subtitle") || theme.subtitle).slice(0, 42)
    const eyebrow = (searchParams.get("eyebrow") || "ORION KEY").slice(0, 20)
    const meta = (searchParams.get("meta") || "数字商品 / 自动发货 / 内容中心").slice(0, 36)
    const tag = (searchParams.get("tag") || label).slice(0, 16)

    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", background: theme.background, color: "#ffffff", padding: "48px", fontFamily: "sans-serif" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "36px", padding: "28px", background: theme.panel, border: "1px solid rgba(255,255,255,0.12)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-80px", right: "-40px", width: "280px", height: "280px", borderRadius: "999px", background: theme.accent }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18, zIndex: 1 }}>
              <div style={{ fontSize: 20, letterSpacing: "0.2em", color: "rgba(255,255,255,0.68)" }}>{eyebrow}</div>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-start", borderRadius: "999px", padding: "12px 22px", background: theme.accent, fontSize: 26 }}>
                {label}
              </div>
              <div style={{ fontSize: 68, lineHeight: 1.15, fontWeight: 700 }}>{title}</div>
              <div style={{ fontSize: 28, color: "rgba(255,255,255,0.84)" }}>{subtitle}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <div style={{ borderRadius: "20px", padding: "10px 16px", background: "rgba(255,255,255,0.10)", fontSize: 20 }}>{tag}</div>
                  <div style={{ fontSize: 22, color: "rgba(255,255,255,0.72)" }}>{meta}</div>
                </div>
                <div style={{ fontSize: 30 }}>{siteName}</div>
              </div>
              <div style={{ borderRadius: "24px", padding: "14px 20px", background: "rgba(255,255,255,0.10)", fontSize: 24 }}>
                {variant.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  } catch {
    return new Response("Failed to generate OG image", { status: 500 })
  }
}

