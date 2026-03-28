import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        secondary: "bg-secondary text-white",
        danger: "bg-danger/10 text-danger border border-danger/20",
        destructive: "bg-danger/10 text-danger border border-danger/20",
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        info: "bg-info/10 text-info border border-info/20",
        outline: "border border-border text-foreground bg-transparent",
        // 护理等级徽章
        vip: "bg-gradient-to-r from-primary to-primary-600 text-white",
        level1: "bg-secondary/10 text-secondary border border-secondary/20",
        level2: "bg-info/10 text-info border border-info/20",
        level3: "bg-gray-100 text-gray-600 border border-gray-200",
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
