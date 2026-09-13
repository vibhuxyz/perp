import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2",
        "text-sm text-text-primary placeholder:text-text-secondary/50",
        "transition-colors focus:border-brand focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-loss aria-invalid:focus:border-loss",
        className
      )}
      {...props}
    />
  )
}

export { Input }
