import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/** Shade block in the exact shape of the content it stands in for. */
function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("kame-skeleton rounded-sm bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
