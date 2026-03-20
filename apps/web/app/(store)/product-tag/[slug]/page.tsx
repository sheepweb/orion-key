import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/store/product-card"
import { SeoLinkSection } from "@/components/store/seo-link-section"
import { slugifyTag } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import { getProducts, getSiteConfig } from "@/services/api-server"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [productsData, config] = await Promise.all([
    getProducts({ page: 1, page_size: 1000 }).catch(() => ({ list: [], pagination: { page: 1, page_size: 1000, total: 0 } })),
    getSiteConfig().catch(() => null),
  ])
  const matchedTag = productsData.list.flatMap((product) => product.tags || []).find((tag) => slugifyTag(tag) === slug)
  if (!matchedTag) return { title: "商品标签不存在" }

  return buildSeoMetadata({
    title: `${matchedTag} 商品标签聚合`,
    description: `查看 ${matchedTag} 标签下的商品列表，快速聚合相关数字商品与购买入口。`,
    path: `/product-tag/${slug}`,
    siteConfig: config,
  })
}

export default async function ProductTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const productsData = await getProducts({ page: 1, page_size: 1000 }).catch(() => ({ list: [], pagination: { page: 1, page_size: 1000, total: 0 } }))
  const products = productsData.list.filter((product) => product.tags?.some((tag) => slugifyTag(tag) === slug))
  const tagName = products.flatMap((product) => product.tags || []).find((tag) => slugifyTag(tag) === slug)
  if (!tagName || products.length === 0) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const relatedTags = Array.from(new Set(productsData.list.flatMap((product) => product.tags || []))).filter((tag) => slugifyTag(tag) !== slug).slice(0, 4)
  const relatedCategories = Array.from(new Map(products.filter((product) => product.category_name).map((product) => [product.category_slug || product.category_id, { name: product.category_name!, href: `/category/${product.category_slug || product.category_id}` }])).values()).slice(0, 4)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${tagName} 商品标签聚合`,
    description: `查看 ${tagName} 标签下的商品列表，快速聚合相关数字商品与购买入口。`,
    url: `${baseUrl}/product-tag/${slug}`,
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">首页</Link>
        <span className="mx-2">/</span>
        <span>商品标签</span>
        <span className="mx-2">/</span>
        <span>#{tagName}</span>
      </nav>

      <div className="space-y-3">
        <p className="text-sm text-primary">商品标签</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">#{tagName}</h1>
        <p className="text-base text-muted-foreground">当前标签下共 {products.length} 件商品，适合快速查看同主题数字商品、对应分类和下单前说明。</p>
      </div>

      <SeoLinkSection
        title="继续浏览"
        items={[
          { href: "/", label: "返回首页", description: "继续浏览热销商品与分类" },
          { href: "/topics", label: "专题内容", description: "查看购买指南、发货说明与售后专题" },
          { href: "/help/buying-guide", label: "购买指南", description: "下单前先查看购买与发货说明" },
          ...relatedTags.map((tag) => ({ href: `/product-tag/${slugifyTag(tag)}`, label: `#${tag}`, description: `查看 ${tag} 标签下的商品` })),
        ]}
      />

      {relatedCategories.length > 0 ? (
        <SeoLinkSection title="相关分类" items={relatedCategories.map((category) => ({ href: category.href, label: category.name, description: `继续查看 ${category.name} 分类商品与说明` }))} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 2xl:grid-cols-4">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>

      <SeoLinkSection
        title="下单前建议"
        items={[
          { href: "/help", label: "帮助中心", description: "查看支付、发货、退款与常见问题" },
          { href: "/topics", label: "专题合集", description: "继续浏览教程、售后说明与使用建议" },
          { href: "/blog", label: "博客公告", description: "查看最新公告、购买建议与上新说明" },
        ]}
      />
    </div>
  )
}

