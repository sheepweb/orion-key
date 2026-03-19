"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useLocale } from "@/lib/context"

interface ProductBreadcrumbProps {
  title: string
  categoryId?: string
  categorySlug?: string
  categoryName?: string
}

export function ProductBreadcrumb({ title, categoryId, categorySlug, categoryName }: ProductBreadcrumbProps) {
  const { t } = useLocale()
  const categoryUrl = categorySlug || categoryId

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Link
        href="/"
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("common.back")}
      </Link>
      <span>/</span>
      {categoryUrl && categoryName ? (
        <>
          <Link
            href={`/category/${categoryUrl}`}
            className="transition-colors hover:text-foreground"
          >
            {categoryName}
          </Link>
          <span>/</span>
        </>
      ) : null}
      <span className="truncate max-w-[200px] sm:max-w-none">{title}</span>
    </div>
  )
}
