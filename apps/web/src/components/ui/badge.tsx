import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

/** Status tag: wash fill + full-color text, 4px radius (DESIGN.md › Tag). */
const badgeVariants = cva(
  "inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap rounded-sm border border-transparent px-1.5 text-xs font-semibold leading-none [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground",
        secondary: "bg-muted text-foreground",
        outline: "border-border bg-card text-foreground",
        muted: "bg-muted text-muted-foreground",
        success: "bg-success-wash text-success",
        warning: "bg-warning-wash text-warning",
        destructive: "bg-due-wash text-due",
        due: "bg-due-wash text-due",
        info: "bg-accent text-accent-foreground",
        ink: "bg-foreground text-background",
      },
      size: {
        default: "",
        sm: "h-[18px] px-1 text-2xs",
        lg: "h-6 px-2 text-13",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({
  className,
  variant,
  size,
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
