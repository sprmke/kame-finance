import { type ReactNode } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { CalendarSheetArt } from "@/components/brand/CalendarSheetArt";
import { ROUTES } from "@/config/routes";

interface AuthPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Sign-in and auth error: the calendar sheet beside a plain panel. */
export function AuthPageShell({ title, description, children, footer }: AuthPageShellProps) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="hidden items-center justify-center border-r bg-muted/50 px-10 py-16 lg:flex">
        <CalendarSheetArt className="w-full max-w-md -rotate-1" />
      </section>
      <section className="flex flex-col px-5 py-6 sm:px-10">
        <BrandLogo href={ROUTES.home} size="sm" />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl">{title}</h1>
              {description ? (
                <p className="text-13 text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {children}
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
