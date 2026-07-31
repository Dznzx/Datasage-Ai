import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#080B13",
          900: "#0B0F1A",
          800: "#11172A",
          700: "#1A2138",
        },
        surface: {
          DEFAULT: "rgba(19,24,38,0.62)",
          light: "rgba(255,255,255,0.72)",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          light: "rgba(15,20,35,0.10)",
        },
        ink: {
          DEFAULT: "#E7ECF5",
          muted: "#8993A8",
          soft: "#B7BFD1",
        },
        sage: {
          DEFAULT: "#34E2C4",
          dim: "#1FA98F",
          bright: "#7CFCE5",
        },
        signal: {
          violet: "#7C7CF0",
          amber: "#F5A623",
          rose: "#F0678C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(52,226,196,0.06), transparent 60%)",
        "aurora":
          "radial-gradient(60% 50% at 20% 10%, rgba(124,124,240,0.20), transparent 60%), radial-gradient(50% 45% at 85% 0%, rgba(52,226,196,0.18), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(52,226,196,0.15), 0 8px 40px -8px rgba(52,226,196,0.25)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 60px -30px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "600" },
          "100%": { strokeDashoffset: "0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        rise: "rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "draw-line": "draw-line 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
