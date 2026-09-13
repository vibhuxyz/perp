/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-bg-elevated text-text-secondary border border-border-subtle",
        brand:   "bg-brand/15 text-brand border border-brand/30",
        profit:  "bg-profit/15 text-profit border border-profit/30",
        loss:    "bg-loss/15 text-loss border border-loss/30",
        warning: "bg-warning/15 text-warning border border-warning/30",
        info:    "bg-info/15 text-info border border-info/30",
        demo:    "bg-brand/15 text-brand border border-brand/30",
        live:    "bg-profit/15 text-profit border border-profit/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
