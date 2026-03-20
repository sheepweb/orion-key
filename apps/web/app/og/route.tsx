import { ImageResponse } from "next/og"

export const runtime = "edge"

type Theme = {
  background: string
  accent: string
  subtitle: string
  panel: string
  badge: string
  align: "flex-start" | "flex-end"
  metaStyle: "stack" | "inline"
  frameLabel: string
  titleWidth: string
}

const THEMES: Record<string, Theme> = {
  default: { background: "linear-gradient(135deg, #111827 0%, #1d4ed8 100%)", accent: "rgba(255,255,255,0.12)", subtitle: "数字商品自动发货 · 购买指南 · 帮助内容", panel: "rgba(255,255,255,0.08)", badge: "内容中心", align: "flex-start", metaStyle: "inline", frameLabel: "站点内容", titleWidth: "92%" },
  blog: { background: "linear-gradient(135deg, #3b0764 0%, #2563eb 100%)", accent: "rgba(255,255,255,0.16)", subtitle: "博客公告 · 更新说明 · 选购建议", panel: "rgba(255,255,255,0.10)", badge: "公告更新", align: "flex-start", metaStyle: "stack", frameLabel: "博客卡片", titleWidth: "88%" },
  topics: { background: "linear-gradient(135deg, #0f172a 0%, #0f766e 100%)", accent: "rgba(255,255,255,0.14)", subtitle: "专题内容 · 购买指南 · 售后建议", panel: "rgba(255,255,255,0.10)", badge: "专题内容", align: "flex-start", metaStyle: "inline", frameLabel: "专题封面", titleWidth: "84%" },
  help: { background: "linear-gradient(135deg, #1f2937 0%, #16a34a 100%)", accent: "rgba(255,255,255,0.14)", subtitle: "帮助中心 · FAQ · 支付与发货说明", panel: "rgba(255,255,255,0.10)", badge: "帮助中心", align: "flex-start", metaStyle: "stack", frameLabel: "帮助文档", titleWidth: "86%" },
  "product-tag": { background: "linear-gradient(135deg, #111827 0%, #ea580c 100%)", accent: "rgba(255,255,255,0.14)", subtitle: "商品标签 · 内容聚合 · 继续发现", panel: "rgba(255,255,255,0.10)", badge: "标签聚合", align: "flex-end", metaStyle: "inline", frameLabel: "标签聚合", titleWidth: "78%" },
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
    const isRightAligned = theme.align === "flex-end"

    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", background: theme.background, color: "#ffffff", padding: "48px", fontFamily: "sans-serif" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "36px", padding: "28px", background: theme.panel, border: "1px solid rgba(255,255,255,0.12)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: isRightAligned ? "auto" : "-80px", bottom: isRightAligned ? "-100px" : "auto", right: isRightAligned ? "auto" : "-40px", left: isRightAligned ? "-60px" : "auto", width: "280px", height: "280px", borderRadius: "999px", background: theme.accent }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: theme.align }}>
                <div style={{ fontSize: 20, letterSpacing: "0.2em", color: "rgba(255,255,255,0.68)" }}>{eyebrow}</div>
                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", alignSelf: theme.align, borderRadius: "999px", padding: "12px 22px", background: theme.accent, fontSize: 24 }}>{theme.badge}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                <div style={{ display: "inline-flex", alignItems: "center", borderRadius: "24px", padding: "14px 20px", background: "rgba(255,255,255,0.10)", fontSize: 24 }}>{variant.toUpperCase()}</div>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.64)" }}>{theme.frameLabel}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: theme.align, gap: 18, zIndex: 1, textAlign: isRightAligned ? "right" : "left" }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", alignSelf: theme.align, borderRadius: "999px", padding: "10px 18px", background: "rgba(255,255,255,0.10)", fontSize: 24 }}>{label}</div>
              <div style={{ fontSize: 68, lineHeight: 1.15, fontWeight: 700, maxWidth: theme.titleWidth }}>{title}</div>
              <div style={{ fontSize: 28, color: "rgba(255,255,255,0.84)", maxWidth: "86%" }}>{subtitle}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                {theme.metaStyle === "stack"
                  ? <><div style={{ borderRadius: "20px", padding: "10px 16px", background: "rgba(255,255,255,0.10)", fontSize: 20 }}>{tag}</div><div style={{ fontSize: 22, color: "rgba(255,255,255,0.72)" }}>{meta}</div></>
                  : <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><div style={{ borderRadius: "20px", padding: "10px 16px", background: "rgba(255,255,255,0.10)", fontSize: 20 }}>{tag}</div><div style={{ fontSize: 22, color: "rgba(255,255,255,0.72)" }}>{meta}</div></div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 30 }}>{siteName}</div>
                  <div style={{ fontSize: 18, color: "rgba(255,255,255,0.62)" }}>Open Graph Preview</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, maxWidth: "220px", textAlign: "right" }}>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.64)" }}>ENTITY TYPE</div>
                <div style={{ fontSize: 24 }}>{theme.badge}</div>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.62)" }}>{label}</div>
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

