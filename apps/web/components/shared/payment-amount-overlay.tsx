"use client"

interface PaymentAmountOverlayProps {
  message: string
}

export function PaymentAmountOverlay({ message }: PaymentAmountOverlayProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background px-5 py-4 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
          ¥
        </div>
        <p className="text-sm font-medium leading-6 text-foreground">
          {message}
        </p>
      </div>
    </div>
  )
}

