import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/** Kame Finance "Kalendaryo" theme — normative source: DESIGN.md. */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        due: {
          DEFAULT: "hsl(var(--due))",
          foreground: "hsl(var(--due-foreground))",
          wash: "hsl(var(--due-wash))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          wash: "hsl(var(--success-wash))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          wash: "hsl(var(--warning-wash))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          muted: "hsl(var(--sidebar-muted))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
          "6": "hsl(var(--chart-6))",
          "7": "hsl(var(--chart-7))",
          "8": "hsl(var(--chart-8))",
        },
      },
      borderRadius: {
        none: "0",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "8px",
        "2xl": "12px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        "13": ["0.8125rem", { lineHeight: "1.15rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.45rem" }],
        lg: ["1.125rem", { lineHeight: "1.6rem" }],
        xl: ["1.375rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.75rem", { lineHeight: "2rem" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "4xl": ["3rem", { lineHeight: "1" }],
        "5xl": ["3.75rem", { lineHeight: "1" }],
      },
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "60": "15rem",
      },
      maxWidth: {
        page: "75rem",
      },
      boxShadow: {
        none: "none",
        overlay: "var(--overlay-shadow)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "120": "120ms",
        "180": "180ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
        "accordion-up": "accordion-up 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
