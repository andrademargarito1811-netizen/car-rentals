import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-brand-600 to-brand-700 text-primary-foreground shadow-lg hover:from-brand-500 hover:to-brand-600 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        destructive: "bg-gradient-to-r from-red-600 to-red-700 text-destructive-foreground shadow-lg hover:from-red-500 hover:to-red-600 hover:-translate-y-0.5 active:translate-y-0",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-gradient-to-r from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-600 text-surface-800 dark:text-surface-200 hover:from-surface-200 hover:to-surface-300 dark:hover:from-surface-600 dark:hover:to-surface-500",
        ghost: "text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/40",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-gradient-to-r from-accent-400 to-accent-500 text-brand-900 font-bold shadow-lg hover:from-accent-300 hover:to-accent-400 hover:-translate-y-0.5 active:translate-y-0 shadow-neon",
        emerald: "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg hover:from-emerald-500 hover:to-emerald-600 hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-emerald-200/20 dark:shadow-emerald-900/30 hover:shadow-lg",
        purple: "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg hover:from-purple-500 hover:to-purple-600 hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-purple-200/20 dark:shadow-purple-900/30 hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-6 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
