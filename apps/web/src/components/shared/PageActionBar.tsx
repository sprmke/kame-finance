"use client";

import { MoreHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

interface PageActionBarProps {
  /** The one action that stays visible on a phone. */
  primary: ReactNode;
  /** Extra actions. Inline from the small breakpoint up; a bottom sheet below that. */
  secondary?: ReactNode;
  className?: string;
}

export function PageActionBar({
  primary,
  secondary,
  className,
}: PageActionBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto",
        className,
      )}
    >
      {secondary ? (
        <>
          <div className="hidden items-center gap-1.5 lg:flex [&_a]:h-9 [&_button]:h-9 [&_label]:h-9">
            {secondary}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 lg:hidden"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="gap-3 rounded-t-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden"
            >
              <SheetHeader className="space-y-0 text-left">
                <SheetTitle className="text-base">Actions</SheetTitle>
              </SheetHeader>
              <div
                className="flex flex-col gap-2 [&_a]:h-11 [&_a]:w-full [&_a]:justify-start [&_button]:h-11 [&_button]:w-full [&_button]:justify-start [&_label]:flex [&_label]:h-11 [&_label]:w-full [&_label]:items-center [&_label]:justify-start"
                onClick={() => {
                  requestAnimationFrame(() => setOpen(false));
                }}
              >
                {secondary}
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : null}
      <div className="min-w-0 [&_a]:h-11 lg:[&_a]:h-9 [&_button]:h-11 lg:[&_button]:h-9">
        {primary}
      </div>
    </div>
  );
}
