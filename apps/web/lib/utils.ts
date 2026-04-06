import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

const SHANGHAI_TIME_ZONE = "Asia/Shanghai"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Dynamic currency symbol cache (populated from API via initCurrencySymbols)
let currencySymbolMap: Record<string, string> = {}

export function initCurrencySymbols(currencies: { code: string; symbol: string }[]) {
  currencySymbolMap = {}
  for (const c of currencies) {
    currencySymbolMap[c.code] = c.symbol
  }
}

export function getCurrencySymbol(currency?: string): string {
  if (currency && currencySymbolMap[currency]) {
    return currencySymbolMap[currency]
  }
  // Static fallback for common currencies
  switch (currency) {
    case "USD": return "$"
    case "USDT": return "₮"
    case "EUR": return "€"
    case "GBP": return "£"
    case "JPY": return "¥"
    case "CNY":
    default: return "¥"
  }
}

export function formatPrice(amount: number, currency?: string): string {
  return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`
}

export function detectPaymentDevice(): string {
  if (typeof window === 'undefined') return 'pc'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('micromessenger')) return 'wechat'
  if (ua.includes('alipayclient') || ua.includes('alipay')) return 'alipay'
  if (/android|iphone|ipad|ipod|mobile/i.test(ua)) return 'mobile'
  return 'pc'
}

export function isMobileDevice(): boolean {
  return detectPaymentDevice() !== 'pc'
}

/** Strip invisible Unicode control characters (direction marks, zero-width chars, BOM) */
export function stripInvisible(text: string): string {
  return text.replace(/[\u200B-\u200F\u2060\uFEFF]/g, '')
}

function resolveLocale(locale?: string): string {
  return locale === "en" ? "en-US" : "zh-CN"
}

function parseShanghaiDateInput(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (!match) {
    return null
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match
  return new Date(Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - 8,
    Number(minute),
    Number(second)
  ))
}

function normalizeDateInput(value: string | number | Date): Date {
  if (typeof value === "string") {
    const parsed = parseShanghaiDateInput(value)
    if (parsed) {
      return parsed
    }
  }

  return value instanceof Date ? value : new Date(value)
}

export function formatDateTime(value?: string | number | Date | null, locale?: string): string {
  if (!value) {
    return "-"
  }

  try {
    const date = normalizeDateInput(value)
    if (Number.isNaN(date.getTime())) {
      return String(value)
    }

    return date.toLocaleString(resolveLocale(locale), {
      timeZone: SHANGHAI_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch {
    return String(value)
  }
}

export function formatDate(value?: string | number | Date | null, locale?: string): string {
  if (!value) {
    return "-"
  }

  try {
    const date = normalizeDateInput(value)
    if (Number.isNaN(date.getTime())) {
      return String(value)
    }

    return date.toLocaleDateString(resolveLocale(locale), {
      timeZone: SHANGHAI_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch {
    return String(value)
  }
}
