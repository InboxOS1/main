import type { Config } from "tailwindcss";

/**
 * InboxOS design tokens.
 *
 * Palette is a "mission control at dusk" direction, not a generic dark theme:
 * a warm deep-indigo ground (not pure black) with two working accents
 * (amber = signal/opportunity, cyan = scan/data) plus a single danger
 * color reserved for urgency. See README "Design notes" for the rationale.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1320", // base background
          raised: "#121C2E", // card / surface
          line: "#1F2B40", // hairline borders
        },
        paper: {
          DEFAULT: "#EDEFF4", // primary text on dark
          dim: "#8C96AC", // muted/secondary text
        },
        signal: {
          DEFAULT: "#F2A93B", // amber — opportunity / primary accent
          dim: "#7A5A22",
        },
        scope: {
          DEFAULT: "#5FD4D0", // cyan — scan / data / links
          dim: "#28615F",
        },
        alert: {
          DEFAULT: "#F2654B", // coral — urgent / overdue
          dim: "#7A2E22",
        },
        border: "#1F2B40",
        input: "#1F2B40",
        ring: "#5FD4D0",
        background: "#0B1320",
        foreground: "#EDEFF4",
        primary: { DEFAULT: "#F2A93B", foreground: "#0B1320" },
        secondary: { DEFAULT: "#121C2E", foreground: "#EDEFF4" },
        muted: { DEFAULT: "#121C2E", foreground: "#8C96AC" },
        accent: { DEFAULT: "#5FD4D0", foreground: "#0B1320" },
        destructive: { DEFAULT: "#F2654B", foreground: "#0B1320" },
        card: { DEFAULT: "#121C2E", foreground: "#EDEFF4" },
        popover: { DEFAULT: "#121C2E", foreground: "#EDEFF4" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        scope: "0 0 0 1px #1F2B40, 0 12px 40px -16px rgba(242,169,59,0.18)",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        blip: {
          "0%, 100%": { opacity: "0.45", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        sweep: "sweep 6s linear infinite",
        blip: "blip 2.4s ease-in-out infinite",
        rise: "rise 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
