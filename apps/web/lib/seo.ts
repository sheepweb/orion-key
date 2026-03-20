import type { Metadata } from "next"
import type { SiteConfig } from "@/types"

type SeoInput = {
  title?: string
  description?: string
  path: string
  siteName?: string
  defaultTitle?: string
  defaultDescription?: string
  imageUrl?: string | null
  type?: "website" | "article"
  keywords?: string | null
  siteConfig?: Partial<SiteConfig> | null
}

function resolveSiteName(siteConfig?: Partial<SiteConfig> | null, siteName?: string) {
  return siteConfig?.site_name || siteName || "Orion Key"
}

function resolveContentLabel(path: string) {
  if (path === "/feed") return "内容中心"
  if (path === "/help/faq") return "常见问题"
  if (path.startsWith("/blog")) return "博客公告"
  if (path.startsWith("/topics")) return "专题内容"
  if (path.startsWith("/help")) return "帮助中心"
  if (path.startsWith("/product-tag")) return "商品标签"
  return "数字商品"
}

function resolveContentVariant(path: string) {
  if (path === "/feed") return "default"
  if (path.startsWith("/blog")) return "blog"
  if (path.startsWith("/topics")) return "topics"
  if (path.startsWith("/help")) return "help"
  if (path.startsWith("/product-tag")) return "product-tag"
  return "default"
}

function resolveContentSubtitle(path: string) {
  if (path === "/feed") return "内容中心 · 最近更新 · RSS 订阅入口"
  if (path === "/help/faq") return "常见问题 · 高频问题 · 快速排查"
  if (path.startsWith("/blog")) return "博客公告 · 更新说明 · 选购建议"
  if (path.startsWith("/topics")) return "专题内容 · 购买指南 · 售后建议"
  if (path.startsWith("/help")) return "帮助中心 · FAQ · 支付与发货说明"
  if (path.startsWith("/product-tag")) return "商品标签 · 内容聚合 · 继续发现"
  return "数字商品自动发货 · 购买指南 · 帮助内容"
}

function resolveContentEyebrow(path: string) {
  if (path === "/feed") return "FEED"
  if (path === "/help/faq") return "FAQ"
  if (path.startsWith("/blog")) return "BLOG"
  if (path.startsWith("/topics")) return "TOPICS"
  if (path.startsWith("/help")) return "HELP"
  if (path.startsWith("/product-tag")) return "TAG"
  return "ORION KEY"
}

function resolveContentMeta(path: string) {
  if (path === "/feed") return "内容中心 / 最近更新 / RSS"
  if (path === "/help/faq") return "FAQ / 高频问题 / 快速定位"
  if (path.startsWith("/blog")) return "公告 / 上新 / 内容更新"
  if (path.startsWith("/topics")) return "购买指南 / 教程 / 售后说明"
  if (path.startsWith("/help")) return "FAQ / 支付 / 发货 / 售后"
  if (path.startsWith("/product-tag")) return "标签聚合 / 商品发现 / 内链"
  return "数字商品 / 自动发货 / 内容中心"
}

function resolveContentTag(path: string) {
  if (path === "/feed") return "内容中心"
  if (path === "/help/faq") return "FAQ"
  if (path.startsWith("/blog")) return "博客公告"
  if (path.startsWith("/topics")) return "专题内容"
  if (path.startsWith("/help")) return "帮助中心"
  if (path.startsWith("/product-tag")) return "商品标签"
  return "数字商品"
}

function buildDynamicOgUrl(path: string, title: string, siteName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const params = new URLSearchParams({
    title,
    label: resolveContentLabel(path),
    siteName,
    variant: resolveContentVariant(path),
    subtitle: resolveContentSubtitle(path),
    eyebrow: resolveContentEyebrow(path),
    meta: resolveContentMeta(path),
    tag: resolveContentTag(path),
  })
  return `${baseUrl}/og?${params.toString()}`
}

function resolveFallbackImage(path: string, title: string, siteName: string, siteConfig?: Partial<SiteConfig> | null) {
  return siteConfig?.seo_og_image || buildDynamicOgUrl(path, title, siteName) || siteConfig?.logo_url || undefined
}

export function buildTitleTemplate(siteConfig?: Partial<SiteConfig> | null, siteName?: string) {
  return siteConfig?.seo_title_template || `%s | ${resolveSiteName(siteConfig, siteName)}`
}

export function buildSeoMetadata({
  title,
  description,
  path,
  siteName,
  defaultTitle,
  defaultDescription,
  imageUrl,
  type = "website",
  keywords,
  siteConfig,
}: SeoInput): Metadata {
  const finalSiteName = resolveSiteName(siteConfig, siteName)
  const resolvedDefaultTitle = siteConfig?.seo_default_title || defaultTitle || finalSiteName
  const resolvedDefaultDescription = siteConfig?.seo_default_description || defaultDescription || siteConfig?.site_description || siteConfig?.site_slogan || "数字商品自动发货平台"
  const finalTitle = title || resolvedDefaultTitle
  const finalDescription = description || resolvedDefaultDescription
  const finalKeywords = keywords || siteConfig?.seo_default_keywords || undefined
  const finalImageUrl = imageUrl || resolveFallbackImage(path, finalTitle, finalSiteName, siteConfig) || siteConfig?.logo_url || undefined
  const ogTitle = siteConfig?.seo_og_title || finalTitle
  const ogDescription = siteConfig?.seo_og_description || finalDescription

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: path,
      type,
      siteName: finalSiteName,
      ...(finalImageUrl ? { images: [{ url: finalImageUrl }] } : {}),
    },
    twitter: {
      card: finalImageUrl ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      ...(finalImageUrl ? { images: [finalImageUrl] } : {}),
    },
  }
}

export function buildPageTitle(title: string, siteName?: string) {
  return siteName ? `${title} - ${siteName}` : title
}

