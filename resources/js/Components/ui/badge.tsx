import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline:
          "text-foreground",
        pending:
          "border-transparent bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-400/20",
        confirmed:
          "border-transparent bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-400/20",
        active:
          "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20",
        completed:
          "border-transparent bg-surface-100 text-surface-600 ring-1 ring-surface-300/30 dark:bg-surface-700/50 dark:text-surface-400 dark:ring-surface-600/30",
        cancelled:
          "border-transparent bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-400/20",
        payment_pending:
          "border-transparent bg-amber-50 text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-400/20",
        payment_paid:
          "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20",
        payment_completed:
          "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20",
        payment_failed:
          "border-transparent bg-red-50 text-red-700 ring-1 ring-red-500/20 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-400/20",
        payment_refunded:
          "border-transparent bg-purple-50 text-purple-700 ring-1 ring-purple-500/20 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-400/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
