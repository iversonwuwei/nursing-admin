import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md text-xs font-semibold transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        /* 默认主色 */
        default: "bg-primary text-primary-foreground",
        /* 次要/幽灵 */
        secondary: "bg-secondary/10 text-secondary border border-secondary/20",
        destructive: "bg-danger/10 text-danger border border-danger/20",
        success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-100 text-amber-700 border border-amber-200",
        info: "bg-sky-100 text-sky-700 border border-sky-200",
        /* 护理等级 */
        critical: "bg-red-100 text-red-700 border border-red-200 font-bold",
        high: "bg-amber-100 text-amber-700 border border-amber-200",
        medium: "bg-sky-100 text-sky-700 border border-sky-200",
        low: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        /* 通用 */
        outline: "border border-border text-foreground bg-transparent",
        neutral: "bg-stone-100 text-stone-600 border border-stone-200",
        orange: "bg-orange-100 text-orange-700 border border-orange-200",
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
