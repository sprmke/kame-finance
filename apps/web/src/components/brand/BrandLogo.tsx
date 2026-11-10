import Link from "next/link";
import type { Route } from "next";

import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils/cn";

interface BrandLogoProps {
  href?: Route;
  className?: string;
  /** Kept for API compatibility; the wordmark carries no tagline. */
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

const TITLE_SIZE = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
} as const;

/** Mark + "Kame Finance" set in the condensed headline cut. */
export function BrandLogo({ href, className, size = "md" }: BrandLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark size={size} />
      <span
        className={cn(
          "font-headline whitespace-nowrap leading-none text-foreground",
          TITLE_SIZE[size],
        )}
      >
        Kame Finance
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Kame Finance home"
        className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {content}
      </Link>
    );
  }

  return content;
}
