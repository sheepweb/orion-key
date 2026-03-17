"use client"

interface PaymentAmountOverlayProps {
  description: string
  amount: string
  confirmText: string
  onConfirm: () => void
}

export function PaymentAmountOverlay({ description, amount, confirmText, onConfirm }: PaymentAmountOverlayProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background px-5 py-5 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
          ¥
        </div>
        <p className="text-sm font-medium leading-6 text-foreground">
          {description}
        </p>
        <p className="mt-3 text-3xl font-bold leading-none text-red-500 dark:text-red-400">
          {amount}
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          {confirmText}
        </button>
      </div>
    </div>
  )
}

