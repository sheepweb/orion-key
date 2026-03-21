import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { Package } from "lucide-react"
import { getProductDetail, getPaymentChannels, getProducts, getSiteConfig } from "@/services/api-server"
import { ProductActions } from "./product-actions"
import { ProductBreadcrumb } from "./product-breadcrumb"
import { ProductDescription } from "./product-description"
import { ScrollToTop } from "./scroll-to-top"
import { ProductCard } from "@/components/store/product-card"
import { slugifyTag } from "@/lib/content-loader"
import { buildSeoMetadata } from "@/lib/seo"
import type { Metadata } from "next"
import type { ProductCard as ProductCardType, PaymentChannelItem } from "@/types"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const [product, config] = await Promise.all([
      getProductDetail(id),
      getSiteConfig().catch(() => null),
    ])
    const productPath = product.slug || product.id
    return buildSeoMetadata({
      title: product.seo_title || product.title,
      description: product.seo_description || product.description || product.title,
      path: `/product/${productPath}`,
      keywords: product.seo_keywords,
      imageUrl: product.cover_url,
      siteConfig: config,
    })
  } catch {
    return { title: "Not Found" }
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, channels, relatedProductsData] = await Promise.all([
    getProductDetail(id).catch(() => null),
    getPaymentChannels().catch(() => [] as PaymentChannelItem[]),
    getProductDetail(id)
      .then((detail) => getProducts({ category_id: detail.category_id, page: 1, page_size: 8 }))
      .catch(() => ({ list: [] as ProductCardType[], pagination: { page: 1, page_size: 8, total: 0 } })),
  ])

  if (!product) notFound()
  if (product.slug && id !== product.slug) permanentRedirect(`/product/${product.slug}`)

  const relatedProducts = relatedProductsData.list.filter((item) => item.id !== product.id).slice(0, 4)
  const inStock = (product.specs?.[0]?.stock_available ?? product.stock_available ?? 0) > 0
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const productPath = product.slug || product.id
  const categoryPath = product.category_slug || product.category_id

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: baseUrl },
      ...(categoryPath && product.category_name ? [{ "@type": "ListItem", position: 2, name: product.category_name, item: `${baseUrl}/category/${categoryPath}` }] : []),
      { "@type": "ListItem", position: product.category_name ? 3 : 2, name: product.title, item: `${baseUrl}/product/${productPath}` },
    ],
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    url: `${baseUrl}/product/${productPath}`,
    ...(product.cover_url ? { image: product.cover_url } : {}),
    offers: { "@type": "Offer", price: product.base_price, priceCurrency: product.currency || "CNY", availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  }

  return (
    <div className="flex flex-col gap-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductBreadcrumb title={product.title} categoryId={product.category_id} categorySlug={product.category_slug} categoryName={product.category_name} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2"><div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted sm:aspect-[5/4] lg:aspect-square">{product.cover_url ? <img src={product.cover_url} alt={product.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Package className="h-20 w-20 text-muted-foreground/20" /></div>}</div></div>
        <div className="lg:col-span-3"><ProductActions product={product} channels={channels} /></div>
      </div>
      {product.tags?.length ? (
        <section className="space-y-2 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">商品标签</h2>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Link
                key={tag}
                href={`/product-tag/${slugifyTag(tag)}`}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <ProductDescription product={product} />
      {relatedProducts.length > 0 ? (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">同分类推荐</h2>
            <p className="text-sm text-muted-foreground">继续浏览同类商品，提升选品效率，也有助于搜索引擎理解当前分类主题。</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      ) : null}
      <ScrollToTop />
    </div>
  )
}
