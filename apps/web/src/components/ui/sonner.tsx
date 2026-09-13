import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--color-bg-elevated)",
          "--normal-text": "var(--color-text-primary)",
          "--normal-border": "var(--color-border-subtle)",
          "--border-radius": "10px",
          "--success-bg": "color-mix(in srgb, var(--color-profit) 12%, var(--color-bg-elevated))",
          "--success-border": "color-mix(in srgb, var(--color-profit) 30%, transparent)",
          "--success-text": "var(--color-profit)",
          "--error-bg": "color-mix(in srgb, var(--color-loss) 12%, var(--color-bg-elevated))",
          "--error-border": "color-mix(in srgb, var(--color-loss) 30%, transparent)",
          "--error-text": "var(--color-loss)",
          "--warning-bg": "color-mix(in srgb, var(--color-warning) 12%, var(--color-bg-elevated))",
          "--warning-border": "color-mix(in srgb, var(--color-warning) 30%, transparent)",
          "--warning-text": "var(--color-warning)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
