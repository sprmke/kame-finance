import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know the theme's custom font sizes; otherwise `text-13`
 * is read as a text color and silently drops `text-primary-foreground` etc.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["2xs", "13"] }],
      shadow: [{ shadow: ["overlay"] }],
      "duration": [{ duration: ["120", "180"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
