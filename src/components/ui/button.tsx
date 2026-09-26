import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-premium group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight cursor-pointer select-none transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300",
  {
    variants: {
      variant: {
        default: "btn-glow text-primary-foreground",
        premium: "btn-glow btn-glow--rich text-primary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_8px_24px_-10px_var(--color-destructive)] hover:brightness-110 hover:shadow-[0_12px_32px_-10px_var(--color-destructive)]",
        outline:
          "btn-outline-glow border border-border bg-surface/60 backdrop-blur-md text-foreground hover:border-primary/50 hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground border border-border/60 shadow-sm hover:bg-secondary/80 hover:border-primary/30 hover:shadow-[0_10px_28px_-16px_var(--color-primary)]",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]",
        link: "text-primary underline-offset-4 hover:underline hover:drop-shadow-[0_0_10px_color-mix(in_oklab,var(--color-primary)_55%,transparent)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-2xl px-8 text-[15px]",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
