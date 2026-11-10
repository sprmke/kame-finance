import { cn } from "@/lib/utils/cn";

/** Segmented control (DESIGN.md › Tabs): a shade track, the active segment is a sheet. */
export const segmentedToggleRootClass = cn(
  "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md border bg-muted p-0.5",
);

export const segmentedToggleButtonClass = (isActive: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[5px] px-3 text-13 font-semibold transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "max-lg:h-10",
    isActive
      ? "bg-card text-foreground ring-1 ring-border"
      : "text-muted-foreground hover:text-foreground",
  );

export const segmentedToggleIconClass = "h-4 w-4 shrink-0";

export const segmentedToggleLabelClass = "hidden sm:inline";
