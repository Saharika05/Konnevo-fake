import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", {
  variants: {
    variant: {
      info: "bg-primary-soft text-primary-text",
      success: "bg-success-soft text-success-text",
      attended: "bg-deep-olive text-soft-white",
      warning: "bg-warning-soft text-warning-text",
      danger: "bg-danger-soft text-danger-text",
      neutral: "bg-subtle text-muted",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
