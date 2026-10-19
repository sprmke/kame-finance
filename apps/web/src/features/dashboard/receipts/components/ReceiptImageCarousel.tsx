"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MediaPreviewSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { isPdfReceipt } from "../lib/receipt-display";
import { receiptFileUrl, type ReceiptListItem } from "../lib/receipt-utils";

type ReceiptImageCarouselProps = {
  slides: ReceiptListItem[];
  index: number;
  onIndexChange: (index: number) => void;
  title: string;
};

const SWIPE_THRESHOLD_PX = 48;

export function ReceiptImageCarousel({
  slides,
  index,
  onIndexChange,
  title,
}: ReceiptImageCarouselProps) {
  const [blobs, setBlobs] = useState<Record<string, string>>({});
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const dragStart = useRef<{ x: number; y: number; pointerId: number } | null>(
    null,
  );
  const slideKey = slides.map((slide) => slide.id).join(",");
  const count = slides.length;
  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);

  useEffect(() => {
    if (count === 0) return;

    let cancelled = false;
    const created: string[] = [];
    const controllers = slides.map(() => new AbortController());

    async function loadSlides() {
      await Promise.all(
        slides.map(async (slide, slideIndex) => {
          const controller = controllers[slideIndex];
          if (!controller) return;

          try {
            const res = await fetch(receiptFileUrl(slide.id), {
              signal: controller.signal,
              credentials: "same-origin",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            created.push(url);
            if (cancelled) return;
            setBlobs((current) =>
              current[slide.id] === url ? current : { ...current, [slide.id]: url },
            );
          } catch {
            if (!controller.signal.aborted && !cancelled) {
              setFailedIds((current) => {
                const next = new Set(current);
                next.add(slide.id);
                return next;
              });
            }
          }
        }),
      );
    }

    void loadSlides();

    return () => {
      cancelled = true;
      for (const controller of controllers) controller.abort();
      for (const url of created) URL.revokeObjectURL(url);
      setBlobs({});
      setFailedIds(new Set());
    };
    // slideKey captures the slide ids that should be loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKey]);

  function goTo(nextIndex: number) {
    if (count < 2) return;
    const wrapped = (nextIndex + count) % count;
    onIndexChange(wrapped);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (count < 2 || event.button !== 0) return;
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start || start.pointerId !== event.pointerId || count < 2) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    goTo(safeIndex + (deltaX < 0 ? 1 : -1));
  }

  const shift =
    count > 0 ? `translateX(-${(safeIndex * 100) / count}%)` : "translateX(0)";

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
    >
      <div
        className="h-full w-full touch-pan-y overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `${Math.max(count, 1) * 100}%`,
            transform: shift,
          }}
        >
          {slides.map((slide, slideIndex) => {
            const src = blobs[slide.id];
            const failed = failedIds.has(slide.id);
            const isPdf = isPdfReceipt(slide.originalFileName);
            const slideTitle = `${title}, image ${slideIndex + 1} of ${count}`;

            return (
              <div
                key={slide.id}
                className="relative h-full min-h-0"
                style={{ width: `${100 / Math.max(count, 1)}%` }}
                aria-hidden={slideIndex !== safeIndex}
              >
                <div className="absolute inset-3 flex items-center justify-center sm:inset-4">
                  {!src && !failed ? (
                    <MediaPreviewSkeleton className="h-full max-h-full min-h-0 w-full lg:min-h-0" />
                  ) : failed || !src ? (
                    <p className="px-4 text-center text-sm text-muted-foreground">
                      Could not load receipt
                    </p>
                  ) : isPdf ? (
                    <iframe
                      src={src}
                      title={slideTitle}
                      className="h-full max-h-full w-full rounded-md border border-border bg-background"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={slideTitle}
                      draggable={false}
                      className="h-full max-h-full w-full max-w-full object-contain"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 z-10 h-11 w-11 -translate-y-1/2 bg-background/90 shadow-sm"
            aria-label="Previous receipt"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => goTo(safeIndex - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 z-10 h-11 w-11 -translate-y-1/2 bg-background/90 shadow-sm"
            aria-label="Next receipt"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => goTo(safeIndex + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium tabular-nums text-foreground shadow-sm">
              {safeIndex + 1} / {count}
            </span>
          </div>
        </>
      ) : null}

    </div>
  );
}
