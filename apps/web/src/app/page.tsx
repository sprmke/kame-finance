import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { CalendarSheetArt } from "@/components/brand/CalendarSheetArt";
import { DayMarkGlyph } from "@/components/calendar/DayMark";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { auth } from "@/lib/auth/auth-config";

/** A card's month, as the product runs it. Facts from docs/product/user-flows.md. */
const MONTH_STEPS = [
  {
    day: "03",
    title: "The statement arrives",
    body: "Kame Finance finds the SOA in Gmail, unlocks the PDF, and reads the dues. Or upload it yourself.",
    mark: "due" as const,
  },
  {
    day: "05",
    title: "It goes on the calendar",
    body: "Minimum and total due land on the due date. No statement by the statement date? It's flagged SOA missing.",
    mark: "missing" as const,
  },
  {
    day: "18",
    title: "Reminders start",
    body: "Telegram and Slack nudges plus Google Calendar events, every day until the card is paid.",
    mark: "urgent" as const,
  },
  {
    day: "21",
    title: "Crossed off",
    body: "Send the payment screenshot. AI checks it against the due and marks the card paid.",
    mark: "paid" as const,
  },
];

const BANKS = ["Metrobank", "RCBC", "BPI", "Unionbank"];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect(ROUTES.dashboard.root);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <BrandLogo size="sm" />
        <Button asChild variant="ghost">
          <Link href={ROUTES.login}>Sign in</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pt-16">
          <div className="space-y-7">
            <h1 className="font-headline max-w-xl text-4xl leading-[0.98] sm:text-5xl">
              Every card&rsquo;s bill, circled and crossed off.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Kame Finance reads your Philippine credit card statements from Gmail,
              puts every due date on one monthly calendar, reminds you until it&rsquo;s
              paid, and checks the card off when your payment receipt matches.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href={ROUTES.login}>
                  Continue with Google
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <CalendarSheetArt className="rotate-[1.5deg]" />
            <p className="mt-3 text-center text-xs text-muted-foreground">Sample month</p>
          </div>
        </section>

        <section aria-labelledby="month-title" className="border-y bg-card">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <h2 id="month-title" className="font-headline text-3xl">
              How a month goes
            </h2>
            <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {MONTH_STEPS.map((step) => (
                <li key={step.title} className="space-y-3 bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="font-numeral text-4xl leading-none">{step.day}</span>
                    <DayMarkGlyph
                      kind={step.mark}
                      className={
                        step.mark === "paid"
                          ? "size-6 text-success"
                          : step.mark === "urgent"
                            ? "size-6 text-due"
                            : step.mark === "missing"
                              ? "size-6 text-warning"
                              : "size-6"
                      }
                    />
                  </div>
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <p className="text-13 leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="font-headline text-3xl">Reads your bank&rsquo;s own statement</h2>
              <p className="max-w-md text-13 leading-relaxed text-muted-foreground">
                Dedicated parsers for four banks; OCR and AI read the rest, including scanned
                PDFs and photos. Statement PDF passwords and integration tokens are encrypted.
              </p>
            </div>
            <ul className="flex flex-wrap content-start gap-2">
              {BANKS.map((bank) => (
                <li
                  key={bank}
                  className="rounded-md border bg-card px-4 py-2.5 text-sm font-bold"
                >
                  {bank}
                </li>
              ))}
              <li className="rounded-md border border-dashed px-4 py-2.5 text-sm text-muted-foreground">
                + other PH issuers via OCR / AI
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-13 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <BrandLogo size="sm" />
          <Link href={ROUTES.login} className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
