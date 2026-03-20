import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import type { Metadata } from "next"
import { ProductCard } from "@/components/store/product-card"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { buildPageTitle, buildSeoMetadata } from "@/lib/seo"
import { getCategoryDetail, getProducts, getSiteConfig } from "@/services/api-server"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  try {
    const [category, config] = await Promise.all([
      getCategoryDetail(id),
      getSiteConfig().catch(() => null),
    ])

    const siteName = config?.site_name || "Orion Key"
    const title = category.seo_title || buildPageTitle(category.name, siteName)
    const description = category.seo_description || `查看 ${category.name} 分类下的商品列表`
    const categoryPath = category.slug || category.id

    return buildSeoMetadata({
      title,
      description,
      path: `/category/${categoryPath}`,
      siteName,
      defaultTitle: siteName,
      defaultDescription: config?.site_description || config?.site_slogan || "数字商品自动发货平台",
      keywords: category.seo_keywords,
    })
  } catch {
    return { title: "分类不存在" }
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [category, config] = await Promise.all([
    getCategoryDetail(id).catch(() => null),
    getSiteConfig().catch(() => null),
  ])

  if (!category) notFound()
  if (category.slug && id !== category.slug) permanentRedirect(`/category/${category.slug}`)

  const productsData = await getProducts({ category_id: category.id, page: 1, page_size: 100 }).catch(() => ({
    list: [],
    pagination: { page: 1, page_size: 100, total: 0 },
  }))

  const categoryPath = category.slug || category.id
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.seo_title || buildPageTitle(category.name, config?.site_name || "Orion Key"),
    description: category.seo_description || `查看 ${category.name} 分类下的商品列表`,
    url: `${baseUrl}/category/${categoryPath}`,
  }
  const linkItems = [
    { href: "/", label: "返回首页浏览全部商品", description: "查看更多分类与热销商品" },
    { href: "/help/buying-guide", label: "查看购买指南", description: "下单前先了解购买流程与注意事项" },
    { href: "/help/faq", label: "查看常见问题", description: "支付、发货、售后等问题可先在 FAQ 中查看" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-3">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回首页</Link>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">商品分类</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{category.name}</h1>
          <p className="text-sm text-muted-foreground">当前分类共 {productsData.pagination.total} 件商品</p>
        </div>
      </div>

      <SeoLinkSection title="分类浏览与购买帮助" items={linkItems} />

      {productsData.list.length > 0 ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 2xl:grid-cols-4">{productsData.list.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-muted-foreground"><Search className="mb-3 h-10 w-10 opacity-20" /><p className="text-sm">该分类下暂时没有可展示的商品</p></div>}
    </div>
  )
}

