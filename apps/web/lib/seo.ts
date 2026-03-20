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

