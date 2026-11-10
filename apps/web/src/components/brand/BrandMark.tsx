import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
} as const;

/**
 * Kame (turtle) seen from above; its shell is a month grid with one date
 * circled in calendar red.
 */
export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0 text-foreground", SIZE_CLASSES[size], className)}
    >
      <TurtleMarkPaths />
    </svg>
  );
}

export function TurtleMarkPaths() {
  return (
    <>
      {/* head */}
      <rect x="13" y="1.5" width="6" height="5.5" rx="2.75" fill="currentColor" />
      {/* flippers */}
      <rect x="3" y="8" width="5" height="7" rx="2.5" transform="rotate(-35 5.5 11.5)" fill="currentColor" />
      <rect x="24" y="8" width="5" height="7" rx="2.5" transform="rotate(35 26.5 11.5)" fill="currentColor" />
      <rect x="4" y="20" width="5" height="6.5" rx="2.5" transform="rotate(35 6.5 23.25)" fill="currentColor" />
      <rect x="23" y="20" width="5" height="6.5" rx="2.5" transform="rotate(-35 25.5 23.25)" fill="currentColor" />
      {/* tail */}
      <path d="M14.5 27.5 L16 31 L17.5 27.5 Z" fill="currentColor" />
      {/* shell: a month page */}
      <rect x="6.5" y="6" width="19" height="22" rx="7" fill="currentColor" />
      <g stroke="hsl(var(--background))" strokeWidth="1.15">
        <path d="M12.8 6.6 V27.4 M19.2 6.6 V27.4" />
        <path d="M7 13.2 H25 M7 20.6 H25" />
      </g>
      {/* the circled date */}
      <path
        d="M20.4 15.1 c-1.2-1.1-3.8-1.2-5 .2-1 1.2-.8 3.4.7 4.4 1.5 1 4.1.6 4.7-1 .5-1.3.2-2.6-1-3.8"
        fill="none"
        stroke="hsl(var(--due))"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  );
}
