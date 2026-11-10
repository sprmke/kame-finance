import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/providers";
import { LOCAL_DEV_APP_URL } from "@/lib/constants/dev-url";
import { fontSans } from "@/lib/fonts";

import "@/env";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kame Finance", template: "%s | Kame Finance" },
  description:
    "Every credit card's statement, due date, reminder, and receipt in one monthly calendar.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.trim() || LOCAL_DEV_APP_URL,
  ),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={fontSans.variable}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
