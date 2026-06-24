import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-mono font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "border-signal/30 bg-signal/10 text-signal",
        scope: "border-scope/30 bg-scope/10 text-scope",
        alert: "border-alert/30 bg-alert/10 text-alert",
        muted: "border-ink-line bg-ink-raised text-paper/50",
        outline: "border-ink-line text-paper/70",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
