import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Search } from "lucide-react"
import type { Metadata } from "next"
import { ProductCard } from "@/components/store/product-card"
import { getCategories, getProducts, getSiteConfig } from "@/services/api-server"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  try {
    const [categories, config] = await Promise.all([
      getCategories(),
      getSiteConfig().catch(() => null),
    ])
    const category = categories.find((item) => item.id === id)
    if (!category) return { title: "分类不存在" }

    const siteName = config?.site_name || "Orion Key"
    const description = `查看 ${category.name} 分类下的商品列表`

    return {
      title: `${category.name} - ${siteName}`,
      description,
      alternates: { canonical: `/category/${id}` },
      openGraph: {
        title: `${category.name} - ${siteName}`,
        description,
        url: `/category/${id}`,
        type: "website",
      },
    }
  } catch {
    return { title: "商品分类" }
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [categories, productsData, config] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ category_id: id, page: 1, page_size: 100 }).catch(() => ({
      list: [],
      pagination: { page: 1, page_size: 100, total: 0 },
    })),
    getSiteConfig().catch(() => null),
  ])

  const category = categories.find((item) => item.id === id)
  if (!category) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} - ${config?.site_name || "Orion Key"}`,
    description: `查看 ${category.name} 分类下的商品列表`,
  }

  return (
    <div className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">商品分类</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{category.name}</h1>
          <p className="text-sm text-muted-foreground">
            当前分类共 {productsData.pagination.total} 件商品
          </p>
        </div>
      </div>

      {productsData.list.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 2xl:grid-cols-4">
          {productsData.list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-muted-foreground">
          <Search className="mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm">该分类下暂时没有可展示的商品</p>
        </div>
      )}
    </div>
  )
}

