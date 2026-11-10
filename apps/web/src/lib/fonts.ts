import { Archivo } from "next/font/google";

/**
 * Archivo variable (wght 100–900, wdth 62–125).
 * Normal width carries the UI; `font-numeral` / `font-headline` use the
 * condensed widths for dates, amounts, and month names (see DESIGN.md).
 */
export const fontSans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  axes: ["wdth"],
});
