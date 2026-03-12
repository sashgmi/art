import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-foreground/5 text-foreground ring-foreground/10",
        secondary:
          "bg-secondary text-secondary-foreground ring-secondary/20",
        destructive:
          "bg-destructive/10 text-destructive ring-destructive/20",
        outline:
          "text-foreground ring-border",
        success:
          "bg-emerald-50 text-emerald-700 ring-emerald-200",
        warning:
          "bg-amber-50 text-amber-700 ring-amber-200",
        gold:
          "bg-gold-50 text-gold-700 ring-gold-200",
        residence:
          "bg-blue-50 text-blue-700 ring-blue-200",
        vendor:
          "bg-violet-50 text-violet-700 ring-violet-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
