/* eslint-disable react-refresh/only-export-components */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * PaperTrade button variants — color is semantic, not cosmetic.
 *
 *  brand        → purple  — auth / account / neutral primary CTA
 *  long         → green   — Open Long (Demo) only when authenticated
 *  short        → red     — Open Short (Demo) only when authenticated
 *  destructive  → red     — Close position / close all / danger action
 *  secondary    → subtle  — Cancel / Details / neutral
 *  ghost        → no bg   — icon-only, toolbar actions
 *  outline      → border  — secondary outlined actions
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-semibold whitespace-nowrap transition-all select-none",
    "outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        brand:       "bg-brand text-white hover:bg-brand/85",
        long:        "bg-profit text-black hover:bg-profit/85",
        short:       "bg-loss  text-black hover:bg-loss/85",
        destructive: "bg-loss/15 text-loss border-loss/25 hover:bg-loss/25",
        secondary:   "bg-bg-elevated text-text-primary border-border-subtle hover:bg-bg-elevated/80",
        ghost:       "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
        outline:     "border-border-subtle text-text-secondary bg-transparent hover:bg-bg-elevated hover:text-text-primary",
        default:     "bg-brand text-white hover:bg-brand/85",
      },
      size: {
        default: "h-10 px-4",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-11 px-5",
        icon:    "size-9",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
