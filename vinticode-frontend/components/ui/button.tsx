import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "cursor-pointer select-none",
    // Colour/shadow only — never `transition-all`, which animates layout
    // properties and makes size/position changes visibly lag.
    "transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out",
    // A pressed state: the app had hover styles but no active feedback, so
    // clicks felt inert — especially on touch, which has no hover at all.
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    // Spinner-only disabled buttons still need to read as busy.
    "aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-sm",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline:
          "border border-border bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-border-strong",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-accent",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
        subtle:
          "bg-primary-subtle text-primary-fg hover:bg-primary/15",
        link: "text-primary-fg underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        // 36/40px targets on a 4px rhythm; `icon` sizes match their
        // text-button counterparts so mixed toolbars align.
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 text-[0.9375rem]",
        icon: "size-9",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-md",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
