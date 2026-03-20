import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { AppProviders } from "@/lib/context"
import { buildTitleTemplate } from "@/lib/seo"
import { getSiteConfig } from "@/services/api-server"
import { ThemeScript } from "./theme-script"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => null)
  const siteName = config?.site_name || "Orion Key"
  const defaultTitle = config?.seo_default_title || `${siteName} - 数字商品自动发货平台`
  const defaultDescription = config?.seo_default_description || config?.site_description || config?.site_slogan || "Orion Key 提供数字商品自动发货、订单查询、支付说明与售后帮助等完整服务。"
  const ogTitle = config?.seo_og_title || defaultTitle
  const ogDescription = config?.seo_og_description || defaultDescription
  const ogParams = new URLSearchParams({ title: ogTitle, label: "数字商品", siteName })
  const ogImage = config?.seo_og_image || config?.logo_url || `${baseUrl}/og?${ogParams.toString()}`

  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: buildTitleTemplate(config, siteName),
      default: defaultTitle,
    },
    description: defaultDescription,
    applicationName: siteName,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      siteName,
      url: baseUrl,
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <AppProviders>
          <DynamicFavicon />
          {children}
          <Toaster position="top-center" richColors closeButton />
        </AppProviders>
      </body>
    </html>
  )
}
