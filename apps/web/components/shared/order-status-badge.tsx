"use client"

import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types"
import { useLocale } from "@/lib/context"
import type { TranslationKey } from "@/lib/i18n"

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  REFUNDING: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  REFUNDED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  EXPIRED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

const statusKeys: Record<OrderStatus, TranslationKey> = {
  PENDING: "status.PENDING",
  PAID: "status.PAID",
  DELIVERED: "status.DELIVERED",
  REFUNDING: "status.REFUNDING",
  REFUNDED: "status.REFUNDED",
  EXPIRED: "status.EXPIRED",
}

const fallbackStyle = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"

export function OrderStatusBadge({ status }: { status: OrderStatus | string | null | undefined }) {
  const { t } = useLocale()
  const normalizedStatus = typeof status === "string" ? status.trim() : ""
  const hasKnownStatus = normalizedStatus in statusKeys

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        hasKnownStatus ? statusStyles[normalizedStatus as OrderStatus] : fallbackStyle
      )}
    >
      {hasKnownStatus ? t(statusKeys[normalizedStatus as OrderStatus]) : (normalizedStatus || "未知状态")}
    </span>
  )
}
